
import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'blue' | 'purple' | 'green'; // Kept for API compatibility, logic updated to 'light streak'
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  icon
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative group p-2.5 rounded-[100px] transition-all border-none outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{
        background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
        boxShadow: '10px 10px 30px #bebebe, -10px -10px 30px #ffffff'
      }}
    >
      <div 
        className="relative flex items-center justify-center gap-4 min-w-[280px] h-[60px] px-8 rounded-[100px] overflow-hidden transition-all"
        style={{
          background: 'linear-gradient(165deg, #f5f5f5 0%, #e8e8e8 100%)',
          boxShadow: 'inset 3px 3px 8px #d1d1d1, inset -3px -3px 8px #ffffff'
        }}
      >
        {/* The Streak Layer */}
        {!disabled && (
          <svg className="orbit-light" viewBox="0 0 280 60" preserveAspectRatio="none">
            <rect 
              className="light-path" 
              x="2" y="2" 
              width="276" height="56" 
              rx="28" ry="28"
            />
          </svg>
        )}

        {/* Content Layer */}
        <div className="relative z-10 flex items-center gap-3">
          {icon && (
            <span className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0">
              {icon}
            </span>
          )}
          <span className="text-sm font-bold tracking-wide text-gray-500 group-hover:text-gray-800 transition-colors whitespace-nowrap uppercase">
            {children}
          </span>
          <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-all group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>

        {/* Gloss Overlay */}
        <div className="absolute inset-0 rounded-[100px] border border-white/80 pointer-events-none" />
      </div>
    </motion.button>
  );
};
