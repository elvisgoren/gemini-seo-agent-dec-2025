
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, FormData } from '../types';
import { chatWithBrief } from '../services/geminiService';

interface BriefChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentBrief: string;
  formData: FormData;
  onApplyEdit?: (newContent: string) => void;
  contentType?: 'brief' | 'research' | 'article';
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const BriefChat: React.FC<BriefChatProps> = ({ 
  isOpen, 
  onClose, 
  currentBrief, 
  formData, 
  onApplyEdit, 
  contentType,
  messages,
  setMessages
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const editKeywords = ['change', 'update', 'modify', 'edit', 'rewrite', 'replace', 'remove', 'add', 'fix', 'revise'];
    const isEditRequest = editKeywords.some(keyword => input.toLowerCase().includes(keyword));

    try {
      const result = await chatWithBrief(input, messages, currentBrief, formData, isEditRequest);
      
      const aiMsg: ChatMessage = {
        role: 'model',
        text: result.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);

      if (result.editedContent && onApplyEdit) {
        onApplyEdit(result.editedContent);
        const confirmMsg: ChatMessage = {
          role: 'model',
          text: '✅ Changes have been applied to the document.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmMsg]);
      }
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        role: 'model',
        text: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white/90 backdrop-blur-2xl shadow-2xl z-[100] flex flex-col border-l border-white/20"
        >
          {/* Header */}
          <div className="p-5 border-b bg-gradient-to-r from-blue-600 to-blue-800 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                    <h3 className="font-bold text-sm leading-tight">Co-Pilot Editor</h3>
                    <p className="text-[10px] text-blue-100 font-semibold tracking-wider uppercase">Context Aware AI</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-transparent">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gray-400 mt-12 px-6"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Bot className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-sm font-bold text-gray-600 mb-2">Ready to assist.</p>
                <p className="text-xs leading-relaxed">Ask for clarification, section rewrites, or direct edits to the current document.</p>
              </motion.div>
            )}
            
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none shadow-blue-500/10' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-xs text-gray-400 font-medium italic">Processing edit...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-5 bg-white border-t border-gray-100">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Modify this brief..."
                className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                disabled={isLoading}
              />
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
