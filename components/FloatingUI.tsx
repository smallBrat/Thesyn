import React, { useEffect, useState } from 'react';

// --- Toast Notification ---
interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColors = {
    success: 'bg-black text-white',
    info: 'bg-white text-gray-900 border border-gray-200',
    error: 'bg-red-50 text-red-600 border border-red-100',
  };

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl shadow-black/10 animate-slide-up ${bgColors[type]}`}>
      {type === 'success' && (
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      )}
      {type === 'info' && (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// --- Floating Action Button (FAB) ---
interface FABProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left';
  primary?: boolean;
}

export const FAB: React.FC<FABProps> = ({ onClick, icon, label, position = 'bottom-right', primary = true }) => {
  const posClasses = position === 'bottom-right' ? 'bottom-8 right-8' : 'bottom-8 left-8';
  
  return (
    <button
      onClick={onClick}
      className={`fixed ${posClasses} z-40 group flex items-center justify-center gap-2 p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 animate-pop-in
      ${primary ? 'bg-[#1C1C1C] text-white shadow-black/20 hover:bg-black' : 'bg-white text-gray-900 border border-gray-100 shadow-gray-200/50 hover:border-gray-300'}`}
    >
      {icon}
      {label && (
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap opacity-0 group-hover:opacity-100 text-sm font-medium pr-1">
          {label}
        </span>
      )}
    </button>
  );
};

// --- Context Card ---
interface ContextCardProps {
  title: string;
  content: string;
  onClose: () => void;
}

export const ContextCard: React.FC<ContextCardProps> = ({ title, content, onClose }) => {
  return (
    <div className="fixed bottom-24 left-8 z-30 max-w-xs w-full bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl shadow-black/5 border border-white/50 animate-slide-in-right">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <p className="text-sm text-gray-800 font-medium leading-relaxed">{content}</p>
    </div>
  );
};
