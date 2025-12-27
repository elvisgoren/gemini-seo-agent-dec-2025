import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingOverlayProps {
  status: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-100 text-center relative overflow-hidden">
        
        {/* Animated background gradient blob */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>

        <div className="relative z-10">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gemini is thinking...</h3>
            <p className="text-gray-500 text-sm mb-6 font-medium">{status}</p>
            
            <div className="flex items-center justify-center space-x-2 text-xs text-blue-600 bg-blue-50 py-2 px-4 rounded-full inline-flex">
                <Sparkles className="w-3 h-3" />
                <span>Using gemini-3-pro-preview</span>
            </div>
        </div>
      </div>
    </div>
  );
};
