
import React, { useEffect, useRef, useState } from 'react';
import { FileText, LibraryBig, PenTool, ImageIcon } from 'lucide-react';
import { BriefTab } from '../types';

interface PillNavProps {
  activeTab: BriefTab;
  onTabChange: (tab: BriefTab) => void;
  disabledTabs: {
    research: boolean;
    writer: boolean;
    cover: boolean;
  };
}

export const PillNav: React.FC<PillNavProps> = ({ activeTab, onTabChange, disabledTabs }) => {
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const tabs: { id: BriefTab; label: string; icon: any; disabled: boolean }[] = [
    { id: 'strategy', label: '1. Strategy', icon: FileText, disabled: false },
    { id: 'research', label: '2. Research', icon: LibraryBig, disabled: disabledTabs.research },
    { id: 'writer', label: '3. Writer', icon: PenTool, disabled: disabledTabs.writer },
    { id: 'cover', label: '4. Cover', icon: ImageIcon, disabled: disabledTabs.cover },
  ];

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const activeRect = activeRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setPillStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    }
  }, [activeTab]);

  return (
    <div className="bg-white border-b border-gray-100 py-3 sticky top-[65px] z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div 
          ref={containerRef}
          className="relative flex bg-gray-100/80 p-1 rounded-xl w-fit"
        >
          {/* Sliding Pill Background */}
          <div 
            className="absolute h-[calc(100%-8px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
            style={{ 
              left: `${pillStyle.left + 4}px`, 
              width: `${pillStyle.width - 8}px`,
              top: '4px'
            }}
          />

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                ref={isActive ? activeRef : null}
                disabled={tab.disabled}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative z-10 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors duration-200
                  ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}
                  ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {tab.label}
                {tab.disabled && tab.id !== 'strategy' && (
                   <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full ml-1 font-bold">LOCKED</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
