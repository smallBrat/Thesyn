import React from 'react';
import { Button } from './Button';

interface MediaAnalysisProps {
  mediaType: string;
  result: string;
  onBack: () => void;
}

export const MediaAnalysis: React.FC<MediaAnalysisProps> = ({ mediaType, result, onBack }) => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-3xl font-bold text-gray-900 capitalize">{mediaType} Analysis</h1>
           <Button variant="outline" onClick={onBack} className="text-sm py-2 px-4">Analyze Another</Button>
        </div>
        
        <div className="bg-[#F3E8FF] p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-3 mb-2 text-[#7E22CE]">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <span className="font-bold">Gemini Findings</span>
          </div>
          <p className="text-[#581c87] text-sm">
            Analysis generated using {mediaType === 'audio' ? 'gemini-2.5-flash' : 'gemini-3-pro-preview'}.
          </p>
        </div>

        <div className="prose prose-lg text-gray-700 w-full">
           {result.split('\n').map((line, i) => (
             <p key={i}>{line}</p>
           ))}
        </div>
      </div>
    </div>
  );
};