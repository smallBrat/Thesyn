import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, DocumentContext } from '../types';
import { sendChatMessage, generateSpeech, createAudioBufferFromPCM, transcribeUserAudio } from '../services/geminiService';
import { Toast } from './FloatingUI';

interface ChatViewProps {
  context: DocumentContext;
}

export const ChatView: React.FC<ChatViewProps> = ({ context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I\'ve analyzed the paper. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Audio / Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(history, userMsg.text, context);
      
      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: responseText 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Sorry, something went wrong.",
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Voice Input (Speech to Text) ---
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const text = await transcribeUserAudio(audioBlob);
          if (text) {
            setInput((prev) => (prev ? prev + ' ' + text : text));
          } else {
            setToast({ message: "Could not understand audio.", type: 'error' });
          }
        } catch (error) {
          console.error("Transcription error:", error);
          setToast({ message: "Transcription failed.", type: 'error' });
        } finally {
          setIsTranscribing(false);
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setToast({ message: "Microphone access denied.", type: 'error' });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  // --- Voice Output (Text to Speech) ---
  const handlePlayMessage = async (msgId: string, text: string) => {
    // If already playing this message, stop it
    if (playingMessageId === msgId) {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }
      setPlayingMessageId(null);
      return;
    }

    // Stop any currently playing audio
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }

    setPlayingMessageId(msgId);
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume context if suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBufferData = await generateSpeech(text);
      const audioBuffer = createAudioBufferFromPCM(audioBufferData, audioContextRef.current, 24000);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setPlayingMessageId(null);
        currentSourceRef.current = null;
      };

      source.start(0);
      currentSourceRef.current = source;
    } catch (error) {
      console.error("TTS Playback failed", error);
      setToast({ message: "Could not play audio.", type: 'error' });
      setPlayingMessageId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth pb-24">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-6 py-4 rounded-2xl text-base leading-relaxed relative group ${
                  msg.role === 'user'
                    ? 'bg-black text-white rounded-tr-sm shadow-md shadow-black/10'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                } ${msg.isError ? 'bg-red-50 text-red-600 border border-red-100' : ''}`}
              >
                {msg.text}

                {/* TTS Speaker Icon for Model Messages */}
                {msg.role === 'model' && !msg.isError && (
                  <button
                    onClick={() => handlePlayMessage(msg.id, msg.text)}
                    className={`absolute -bottom-8 -left-2 p-2 rounded-full transition-all duration-300 ${
                      playingMessageId === msg.id 
                        ? 'text-black bg-gray-200' 
                        : 'text-gray-400 hover:text-black hover:bg-gray-100 opacity-0 group-hover:opacity-100'
                    }`}
                    title={playingMessageId === msg.id ? "Stop reading" : "Read aloud"}
                  >
                    {playingMessageId === msg.id ? (
                      <div className="flex gap-1 items-center px-1">
                        <span className="w-1 h-3 bg-current rounded-full animate-[bounce_1s_infinite]"></span>
                        <span className="w-1 h-4 bg-current rounded-full animate-[bounce_1s_infinite_100ms]"></span>
                        <span className="w-1 h-2 bg-current rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                      </div>
                    ) : (
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    )}
                  </button>
                )}
              </div>
              <span className="text-xs text-gray-300 mt-2 px-1">
                {msg.role === 'user' ? 'You' : 'Thesyn'}
              </span>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 px-6 py-4 rounded-2xl rounded-tl-sm flex gap-2 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto shadow-2xl rounded-full bg-white flex items-center">
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Listening..." : isTranscribing ? "Processing audio..." : "Ask a follow-up question..."}
            className={`flex-1 pl-6 pr-24 py-4 bg-transparent rounded-full focus:ring-0 outline-none text-gray-800 placeholder-gray-400 transition-all ${isRecording ? 'animate-pulse bg-red-50' : ''}`}
            disabled={isRecording || isTranscribing}
          />
          
          <div className="absolute right-2 top-2 bottom-2 flex items-center gap-2">
            
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110' 
                  : 'text-gray-400 hover:text-black hover:bg-gray-100'
              } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isRecording ? "Stop recording" : "Use voice input"}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                 <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              ) : isRecording ? (
                 <div className="w-3 h-3 bg-white rounded-sm"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isRecording}
              className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors shadow-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
