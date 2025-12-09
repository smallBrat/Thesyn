import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-full font-bold transition-all duration-200 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#1f2937] text-white hover:bg-black hover:shadow-lg", // Dark like 'Start your free trial'
    secondary: "bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-md", // Purple accent
    outline: "border-2 border-[#1f2937] text-[#1f2937] hover:bg-gray-100",
    ghost: "text-[#4b5563] hover:text-[#1f2937] hover:bg-gray-100/50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};