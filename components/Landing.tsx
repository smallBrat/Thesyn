import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { ComprehensionLevel, DocumentInputType } from '../types';
import { ContextCard, FAB } from './FloatingUI';

interface LandingProps {
  onAnalyze: (type: DocumentInputType, content: string | File, level: ComprehensionLevel) => void;
  isProcessing: boolean;
}

export const Landing: React.FC<LandingProps> = ({ onAnalyze, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<DocumentInputType>('pdf');
  const [selectedLevel, setSelectedLevel] = useState<ComprehensionLevel>(ComprehensionLevel.Undergraduate);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parallax Effect State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setActiveTab('pdf');
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'pdf') {
      if (selectedFile) onAnalyze('pdf', selectedFile, selectedLevel);
    } else if (activeTab === 'text') {
      if (textInput.trim()) onAnalyze('text', textInput, selectedLevel);
    } else if (activeTab === 'url') {
      if (urlInput.trim()) onAnalyze('url', urlInput, selectedLevel);
    }
  };

  const isSubmitDisabled = () => {
    if (isProcessing) return true;
    if (activeTab === 'pdf') return !selectedFile;
    if (activeTab === 'text') return !textInput.trim();
    if (activeTab === 'url') return !urlInput.trim();
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#F8F7F4] text-[#1C1C1C] overflow-hidden preserve-3d">
      
      {/* 3D Parallax Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 preserve-3d">
        <div 
          className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse bg-gradient-to-br from-purple-200 to-blue-200"
          style={{ transform: `translate(${mousePos.x * -1}px, ${mousePos.y * -1}px) translateZ(-50px)` }}
        ></div>
        <div 
          className="absolute bottom-[20%] right-[10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse delay-1000 bg-gradient-to-tr from-yellow-100 to-orange-100"
          style={{ transform: `translate(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px) translateZ(-80px)` }}
        ></div>
        
        {/* Subtle Geometric Shapes */}
        <div 
          className="absolute top-[20%] right-[20%] w-12 h-12 border-2 border-gray-300/30 rounded-xl transform rotate-12 animate-float"
          style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
        ></div>
         <div 
          className="absolute bottom-[15%] left-[20%] w-8 h-8 bg-black/5 rounded-full animate-float"
          style={{ transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)`, animationDelay: '1s' }}
        ></div>
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center space-y-12 animate-fade-in-up preserve-3d" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* Header Section */}
        <div className="text-center space-y-4 transform translate-z-10">
          <h1 className="text-7xl md:text-9xl tracking-tighter text-[#1C1C1C] font-serif leading-none">
            Thesyn<span className="text-2xl align-top opacity-50 ml-1 font-sans font-light">®</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 font-light tracking-wide max-w-lg mx-auto leading-relaxed">
            Your intelligent assistant for <span className="text-[#1C1C1C] font-normal border-b border-gray-300 pb-0.5">complex research</span>.
          </p>
        </div>

        {/* Main Interface Card (Glassmorphism) */}
        <div 
          className="w-full glass-panel rounded-[2.5rem] p-3 shadow-2xl shadow-black/5 border border-white/60 animate-float backdrop-blur-xl transition-transform duration-500 ease-out"
          style={{ transform: `rotateX(${mousePos.y * 0.05}deg) rotateY(${mousePos.x * 0.05}deg)` }}
        >
          <div className="bg-white/80 rounded-[2rem] border border-white p-8 md:p-12 transition-all shadow-inner relative z-10">
            
            {/* Input Method Tabs */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex bg-gray-100/80 p-1.5 rounded-full shadow-inner">
                {([
                  { id: 'pdf', label: 'PDF Upload', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { id: 'text', label: 'Paste Text', icon: 'M4 6h16M4 12h16M4 18h7' },
                  { id: 'url', label: 'Link URL', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' }
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-white text-black shadow-lg shadow-gray-200/50 transform scale-100'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Input Area */}
            <div className="min-h-[260px] flex flex-col justify-center items-center transition-all">
              {activeTab === 'pdf' && (
                <div 
                  className={`w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                    dragActive 
                      ? 'border-black bg-gray-50 scale-[1.01]' 
                      : selectedFile 
                        ? 'border-black/10 bg-gray-50/50' 
                        : 'border-gray-200 hover:border-black/20 hover:bg-gray-50/30'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="application/pdf"
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  
                  {!selectedFile ? (
                    <div className="text-center space-y-4 pointer-events-none z-10">
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto text-gray-400 group-hover:scale-110 transition-all duration-500 group-hover:text-black group-hover:shadow-xl">
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      </div>
                      <div>
                        <p className="text-xl font-medium text-gray-900 group-hover:tracking-wide transition-all">Drop PDF here</p>
                        <p className="text-sm text-gray-400 mt-1">or click to browse files</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 animate-pop-in">
                       <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-black/20">
                         <span className="font-serif text-2xl">Pdf</span>
                       </div>
                       <p className="text-xl font-serif font-bold text-gray-900 mb-1">{selectedFile.name}</p>
                       <p className="text-sm text-gray-500 mb-6 font-mono">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                       <button 
                         onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                         className="text-gray-400 hover:text-red-500 transition-colors text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-50"
                       >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         Remove File
                       </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'text' && (
                <textarea
                  className="w-full h-64 p-8 bg-gray-50/50 border border-gray-200 rounded-3xl focus:ring-0 focus:border-black/20 outline-none resize-none text-lg text-gray-800 placeholder-gray-300 transition-all font-light leading-relaxed shadow-inner hover:bg-white focus:bg-white focus:shadow-lg"
                  placeholder="Paste your research abstract or full text here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              )}

              {activeTab === 'url' && (
                <div className="w-full h-64 flex flex-col justify-center items-center px-4">
                  <div className="w-full max-w-xl relative group">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    </div>
                    <input
                      type="url"
                      className="w-full pl-14 pr-6 py-6 bg-gray-50/50 border border-gray-200 rounded-full focus:ring-0 focus:border-black/20 outline-none text-lg text-gray-800 placeholder-gray-300 transition-all shadow-sm hover:bg-white focus:bg-white focus:shadow-xl"
                      placeholder="https://arxiv.org/abs/..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                  </div>
                  <p className="mt-6 text-sm text-gray-400 font-light">Paste a direct URL to a research paper.</p>
                </div>
              )}
            </div>
            
            {/* Controls & Action */}
            <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-20">
              
              {/* Custom Dropdown for Reading Level */}
              <div className="relative w-full md:w-auto">
                <button
                  onClick={() => setIsLevelDropdownOpen(!isLevelDropdownOpen)}
                  className="w-full md:w-auto flex items-center justify-between md:justify-start gap-4 bg-gray-50 px-6 py-4 rounded-3xl border border-gray-200 hover:border-gray-300 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md group min-w-[260px] text-left"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-gray-600 transition-colors">Target Audience</span>
                    <span className="text-lg font-bold text-gray-900">{selectedLevel}</span>
                  </div>
                  <div className={`text-gray-400 group-hover:text-black transition-all duration-300 transform ${isLevelDropdownOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Dropdown Menu (Opens Upwards) */}
                {isLevelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsLevelDropdownOpen(false)}></div>
                    <div className="absolute bottom-full mb-3 left-0 w-full bg-white rounded-3xl shadow-xl shadow-black/10 border border-gray-100 overflow-hidden animate-pop-in origin-bottom z-30">
                      {Object.values(ComprehensionLevel).map((level) => (
                        <button
                          key={level}
                          onClick={() => { setSelectedLevel(level); setIsLevelDropdownOpen(false); }}
                          className={`w-full text-left px-6 py-4 text-base font-medium transition-all duration-200 flex items-center justify-between group
                            ${selectedLevel === level ? 'bg-gray-50 text-black' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                          `}
                        >
                          {level}
                          {selectedLevel === level && (
                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Button 
                onClick={handleSubmit} 
                isLoading={isProcessing} 
                disabled={isSubmitDisabled()}
                className={`w-full md:w-auto px-12 py-5 text-base font-bold tracking-wide rounded-full transition-all duration-300 hover-lift-3d ${
                  isSubmitDisabled() 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-[#1C1C1C] text-white hover:bg-black shadow-2xl shadow-black/20'
                }`}
              >
                Begin Analysis
              </Button>
            </div>

          </div>
        </div>
        
        {/* Footer / Credits */}
        <div className="text-sm text-gray-400 font-medium tracking-wide">
          Powered by Gemini 3 Pro
        </div>

      </div>

      {/* Floating Help Button on Landing */}
      <FAB 
        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        onClick={() => setShowHelp(!showHelp)}
        primary={false}
        position="bottom-right"
        label="Need Help?"
      />

      {showHelp && (
        <ContextCard 
          title="Getting Started"
          content="Upload a PDF research paper, paste the abstract text, or provide a URL to get a comprehensive AI-powered summary and insights instantly."
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
};