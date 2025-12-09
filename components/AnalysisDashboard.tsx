import React, { useState, useEffect } from 'react';
import { AnalysisResult, DocumentContext, GroundingSource } from '../types';
import { Button } from './Button';
import { ChatView } from './ChatView';
import { generateSpeech, searchRelatedTopics, createAudioBufferFromPCM } from '../services/geminiService';
import { FAB, Toast, ContextCard } from './FloatingUI';

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
  context: DocumentContext;
  onBack: () => void;
}

type Tab = 'summary' | 'chat' | 'glossary' | 'search';

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis, context, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ text: string, sources: GroundingSource[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Floating UI State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showContextCard, setShowContextCard] = useState(true);
  const [randomGlossaryTerm, setRandomGlossaryTerm] = useState<{ term: string; definition: string } | null>(null);

  useEffect(() => {
    // Select a random glossary term to show in the floating context card
    if (analysis.glossary.length > 0) {
      const random = analysis.glossary[Math.floor(Math.random() * analysis.glossary.length)];
      setRandomGlossaryTerm(random);
    }
  }, [analysis]);

  const handlePlayAudio = async () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    setToast({ message: 'Generating audio summary...', type: 'info' });
    
    try {
      const audioBufferData = await generateSpeech(analysis.summary);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Use helper to decode raw PCM data
      const audioBuffer = createAudioBufferFromPCM(audioBufferData, ctx, 24000);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
      setToast({ message: 'Playing summary audio', type: 'success' });
      source.onended = () => setIsPlayingAudio(false);
      
    } catch (e) {
      console.error(e);
      setIsPlayingAudio(false);
      setToast({ message: 'Failed to generate speech', type: 'error' });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const result = await searchRelatedTopics(searchQuery);
    setSearchResults(result);
    setIsSearching(false);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(analysis.summary);
    setToast({ message: 'Summary copied to clipboard', type: 'success' });
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'summary', label: 'Summary', icon: 'M4 6h16M4 12h16M4 18h7' },
    { id: 'chat', label: 'Chatbot', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { id: 'glossary', label: 'Glossary', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'search', label: 'Insights', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  ];

  return (
    <div className="h-screen bg-[#F8F7F4] flex overflow-hidden relative">
      
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-72 bg-white/80 backdrop-blur-md border-r border-gray-200/50 flex flex-col justify-between py-10 px-6 z-20 shadow-xl shadow-gray-200/20">
        <div className="space-y-12">
          <div onClick={onBack} className="cursor-pointer flex items-center gap-4 px-2 group">
             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-lg group-hover:scale-105 transition-transform">T</div>
             <span className="font-serif font-bold text-2xl hidden lg:block tracking-tight text-gray-900">Thesyn</span>
          </div>

          <nav className="space-y-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-lg shadow-black/10 scale-100'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <svg className={`w-5 h-5 flex-shrink-0 transition-colors ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="font-medium hidden lg:block tracking-wide">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button 
          onClick={onBack}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 group"
        >
           <svg className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           <span className="font-medium hidden lg:block">Exit Analysis</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Top Bar */}
        <header className="h-24 flex items-center justify-between px-10 border-b border-gray-200/50 bg-white/60 backdrop-blur-md z-10 sticky top-0">
          <div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 animate-fade-in-up">{tabs.find(t => t.id === activeTab)?.label}</h2>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1 opacity-70">
               {context.type === 'pdf' ? 'Analyzing Document' : context.type === 'url' ? 'Analyzing Web Source' : 'Analyzing Text Input'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'summary' && (
              <>
               <Button variant="ghost" onClick={handleCopySummary} className="text-sm p-3 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
               </Button>
               <Button 
                 variant="outline" 
                 onClick={handlePlayAudio} 
                 isLoading={isPlayingAudio}
                 className="text-sm py-2.5 px-6 rounded-full border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
               >
                 <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 {isPlayingAudio ? 'Playing...' : 'Listen'}
               </Button>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
          <div className="max-w-5xl mx-auto pb-32">
            
            {activeTab === 'summary' && (
              <div className="space-y-12 animate-fade-in-up">
                <div className="bg-white rounded-[2rem] p-8 lg:p-14 shadow-xl shadow-gray-200/40 border border-gray-100 hover-lift-3d">
                  <div className="prose prose-lg prose-slate max-w-none">
                    {analysis.summary.split('\n').map((p, i) => (
                      <p key={i} className="mb-6 text-gray-700 leading-8 font-light text-lg">{p}</p>
                    ))}
                  </div>
                </div>

                <div className="space-y-8 animate-fade-in-up-delay">
                  <h3 className="text-3xl font-serif font-bold text-gray-900 border-l-4 border-black pl-4">Key Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analysis.keyInsights.map((insight, idx) => (
                      <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-black/5 transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125 group-hover:bg-gray-100"></div>
                         <span className="relative z-10 inline-block px-3 py-1 bg-black text-white text-xs font-bold rounded-full mb-5 shadow-lg shadow-black/20">0{idx + 1}</span>
                         <p className="relative z-10 text-gray-800 font-medium leading-relaxed text-lg">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="h-[calc(100vh-220px)] min-h-[500px] animate-fade-in-up">
                <ChatView context={context} />
              </div>
            )}

            {activeTab === 'glossary' && (
              <div className="grid grid-cols-1 gap-5 animate-fade-in-up">
                {analysis.glossary.map((item, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 group">
                    <div className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-8">
                      <h3 className="text-xl font-bold text-gray-900 min-w-[200px] font-serif group-hover:text-black/80 transition-colors">{item.term}</h3>
                      <div className="h-px bg-gray-100 flex-1 my-2 md:hidden"></div>
                      <p className="text-gray-600 font-light leading-relaxed text-lg">{item.definition}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up">
                <div className="text-center space-y-4 mb-14">
                   <h2 className="text-4xl font-serif font-bold text-gray-900">Deep Dive</h2>
                   <p className="text-gray-500 text-lg font-light">Explore related topics across the web powered by Google Search.</p>
                </div>
                
                <div className="bg-white rounded-[2rem] p-3 shadow-2xl shadow-black/5 border border-gray-100 flex items-center transition-transform focus-within:scale-[1.02] duration-300">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask a question or topic..."
                    className="flex-1 p-5 pl-8 bg-transparent border-none focus:ring-0 text-xl outline-none placeholder-gray-300 font-light"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  />
                  <Button 
                    onClick={handleSearch} 
                    isLoading={isSearching}
                    className="rounded-2xl px-10 py-4 mr-1 text-lg shadow-lg"
                  >
                    Search
                  </Button>
                </div>

                {searchResults && (
                  <div className="space-y-8 animate-fade-in-up">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/30">
                      <div className="prose prose-xl prose-slate font-light text-gray-700">
                        <p>{searchResults.text}</p>
                      </div>
                    </div>
                    
                    {searchResults.sources.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {searchResults.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-black/20 hover:shadow-lg transition-all group block hover:-translate-y-1 duration-300"
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-black transition-colors text-lg leading-snug">{source.title}</h4>
                              <div className="bg-gray-50 p-2 rounded-full group-hover:bg-black group-hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400 mt-4 block truncate font-mono">{source.uri}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Floating Contextual Elements */}
        
        {/* FAB: Only show "Ask Chatbot" if NOT on Chat tab */}
        {activeTab !== 'chat' && (
          <FAB 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
            label="Ask Question"
            onClick={() => setActiveTab('chat')}
            position="bottom-right"
          />
        )}
        
        {/* FAB: "Back to Summary" if on Chat/Search */}
        {activeTab === 'chat' && (
           <FAB 
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            label="View Summary"
            onClick={() => setActiveTab('summary')}
            position="bottom-right"
            primary={false}
          />
        )}

        {/* Context Card: Show a random term occasionally or on toggle */}
        {showContextCard && randomGlossaryTerm && activeTab !== 'glossary' && (
          <ContextCard 
            title="Glossary Highlight" 
            content={`${randomGlossaryTerm.term}: ${randomGlossaryTerm.definition}`} 
            onClose={() => setShowContextCard(false)} 
          />
        )}

      </main>
    </div>
  );
};