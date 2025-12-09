import React, { useState } from 'react';
import { Landing } from './components/Landing';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { ComprehensionLevel, AnalysisResult, DocumentContext, DocumentInputType } from './types';
import { analyzeDocument, fileToGenerativePart } from './services/geminiService';

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [documentContext, setDocumentContext] = useState<DocumentContext | null>(null);

  const handleAnalyze = async (type: DocumentInputType, content: string | File, level: ComprehensionLevel) => {
    setIsProcessing(true);
    try {
      let context: DocumentContext;

      if (type === 'pdf' && content instanceof File) {
        const base64Data = await fileToGenerativePart(content);
        context = { type: 'pdf', content: base64Data };
      } else if (type === 'url' && typeof content === 'string') {
        context = { type: 'url', content };
      } else if (type === 'text' && typeof content === 'string') {
        context = { type: 'text', content };
      } else {
        throw new Error("Invalid input");
      }

      setDocumentContext(context);
      const result = await analyzeDocument(context, level);
      setAnalysisResult(result);

    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetApp = () => {
    setAnalysisResult(null);
    setDocumentContext(null);
  };

  // View Routing
  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] p-6 relative overflow-hidden">
        {/* Abstract Background Animation */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
           <div className="w-[500px] h-[500px] bg-black rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        </div>

        <div className="z-10 flex flex-col items-center space-y-8">
           <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
           <div className="text-center space-y-2">
             <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Synthesizing Knowledge</h2>
             <p className="text-gray-500 font-medium">Gemini is reading and structuring your document...</p>
           </div>
        </div>
      </div>
    );
  }

  if (analysisResult && documentContext) {
    return (
      <AnalysisDashboard 
        analysis={analysisResult} 
        context={documentContext} 
        onBack={resetApp} 
      />
    );
  }

  return (
    <Landing 
      onAnalyze={handleAnalyze} 
      isProcessing={isProcessing} 
    />
  );
};

export default App;