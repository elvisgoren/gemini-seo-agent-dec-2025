import React from 'react';
import { ArrowLeft, Clock, FileText, ChevronRight, LibraryBig } from 'lucide-react';
import { BriefHistoryItem } from '../types';

interface HistoryViewProps {
  history: BriefHistoryItem[];
  onSelect: (item: BriefHistoryItem) => void;
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelect, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b sticky top-0 z-10 backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button 
              onClick={onBack} 
              className="mr-4 p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Brief History
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {history.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No briefs generated yet</h3>
            <p className="text-gray-500 mt-2">Generate your first content brief to see it here.</p>
            <button 
              onClick={onBack} 
              className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all shadow-sm hover:shadow-md"
            >
              Create New Brief
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSelect(item)}
                className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                            {item.client}
                        </span>
                        <span className="text-xs text-gray-400">
                            {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        {item.research && (
                            <span className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md font-medium">
                                <LibraryBig className="w-3 h-3" />
                                Research Included
                            </span>
                        )}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                        {item.keyword || "Untitled Brief"}
                    </h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};