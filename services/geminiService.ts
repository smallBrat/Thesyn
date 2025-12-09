import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { ComprehensionLevel, AnalysisResult, GroundingSource, DocumentContext } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to encode file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper for retry logic
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    // Check if it's a 500 or 503 error which are worth retrying
    const isRetryable = error?.status === 500 || error?.status === 503 || error.message?.includes('500') || error.message?.includes('Internal error');
    
    if (isRetryable) {
      console.warn(`Retrying operation... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper to decode raw PCM data from Gemini TTS
export const createAudioBufferFromPCM = (
  rawBuffer: ArrayBuffer, 
  context: AudioContext,
  sampleRate: number = 24000
): AudioBuffer => {
  const data = new Int16Array(rawBuffer);
  const channelCount = 1;
  const frameCount = data.length;
  const audioBuffer = context.createBuffer(channelCount, frameCount, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    // Convert 16-bit PCM to float [-1, 1]
    channelData[i] = data[i] / 32768.0;
  }

  return audioBuffer;
};

// 1. Core Analysis (Summary + Glossary + Insights)
export const analyzeDocument = async (
  context: DocumentContext, 
  level: ComprehensionLevel
): Promise<AnalysisResult> => {
  
  const prompt = `
    Analyze the provided research paper content. 
    Target Audience Level: ${level}.
    
    Please provide:
    1. A comprehensive summary suited for the target audience.
    2. A glossary of 5-10 key technical terms used in the text with simple definitions.
    3. 3-5 key insights or takeaways from the paper.

    Output pure JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "The main summary of the paper." },
      glossary: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            definition: { type: Type.STRING }
          },
          required: ["term", "definition"]
        }
      },
      keyInsights: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["summary", "glossary", "keyInsights"]
  };

  const parts = [];
  
  if (context.type === 'pdf') {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: context.content
      }
    });
    parts.push({ text: prompt });
  } else if (context.type === 'url') {
    parts.push({ text: `Please read and analyze the research paper at this URL: ${context.content}` });
    parts.push({ text: prompt });
  } else {
    parts.push({ text: context.content });
    parts.push({ text: prompt });
  }

  const generateOp = async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { role: 'user', parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        thinkingConfig: {
          thinkingBudget: 32768
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("No response generated");
  };

  try {
    return await retryOperation(generateOp);
  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

// 2. Chatbot with Document Context
export const sendChatMessage = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string,
  context: DocumentContext
): Promise<string> => {
  
  const systemInstruction = `You are a helpful research assistant. Answer questions strictly based on the provided research paper context. If the answer is not in the context, state that.

  IMPORTANT: Respond in clean plain text only.
  - Do not use any Markdown formatting such as bold, italics, headings, bullet points, or symbols.
  - Do not wrap text with asterisks (*), hashes (#), dashes (-), or any special formatting markers.
  - Write every answer in simple, natural, paragraph-style plain text.
  - Keep explanations clear, direct, and conversational.
  - Do not add decorative formatting. No bold, no italics, no lists, no emojis.
  - If you need to emphasize something, use natural language instead of formatting.`;

  // Construct the initial context message to seed the chat history with the document
  let contextMessage;
  if (context.type === 'pdf') {
    contextMessage = {
      role: 'user',
      parts: [
        { text: "Here is the research paper to reference:" },
        { inlineData: { mimeType: 'application/pdf', data: context.content } }
      ]
    };
  } else if (context.type === 'url') {
    contextMessage = {
      role: 'user',
      parts: [{ text: `Here is the URL of the research paper to reference: ${context.content}` }]
    };
  } else {
    contextMessage = {
      role: 'user',
      parts: [{ text: `Here is the text of the research paper to reference:\n\n${context.content.substring(0, 30000)}` }]
    };
  }

  // Prepend context to history if it's the start of the conversation
  const fullHistory = [contextMessage, { role: 'model', parts: [{ text: "I have read the paper. How can I help you?" }] }, ...history];

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: systemInstruction,
      },
      history: fullHistory
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat failed", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

// 3. Search Grounding
export const searchRelatedTopics = async (query: string): Promise<{ text: string, sources: GroundingSource[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: `Find recent information related to: ${query}` }] },
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "No results found.";
    
    // Extract grounding sources
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Search failed", error);
    return { text: "Search currently unavailable.", sources: [] };
  }
};

// 4. TTS (Text to Speech)
export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text: text.substring(0, 400) }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;

  } catch (error) {
    console.error("TTS failed", error);
    throw error;
  }
};

// 5. Speech to Text (Transcription)
export const transcribeUserAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Result is "data:audio/webm;base64,..."
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: audioBlob.type, data: base64Audio } },
          { text: "Transcribe this audio exactly as spoken. Return only the transcription, no other text." }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Transcription failed", error);
    throw error;
  }
};