
import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Loader2, Download, X, RefreshCw, Palette, Layers, Info, Trash2 } from 'lucide-react';
import { ImagePrompt, ImageStyle, FormData } from '../types';
import { generateImagePrompts, generateImage } from '../services/geminiService';
import { AnimatedButton } from './AnimatedButton';
import { motion, AnimatePresence } from 'framer-motion';

interface CoverImageViewProps {
  article: string;
  formData: FormData;
  prompts: ImagePrompt[];
  onUpdatePrompts: (prompts: ImagePrompt[]) => void;
}

export const CoverImageView: React.FC<CoverImageViewProps> = ({ article, formData, prompts, onUpdatePrompts }) => {
  const [style, setStyle] = useState<ImageStyle>('PHOTOREALISTIC');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [suggestions, setSuggestions] = useState('');
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleGeneratePrompts = async () => {
    setIsGeneratingPrompts(true);
    try {
      const contentForAI = article || formData.articleDirection || formData.targetKeyword;
      const newPrompts = await generateImagePrompts(contentForAI, style, aspectRatio, suggestions);
      onUpdatePrompts(newPrompts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleGenerateImage = async (promptId: string) => {
    const promptIndex = prompts.findIndex(p => p.id === promptId);
    if (promptIndex === -1) return;

    const updatedPrompts = [...prompts];
    updatedPrompts[promptIndex] = { ...updatedPrompts[promptIndex], isLoading: true };
    onUpdatePrompts(updatedPrompts);

    try {
      const imageUrl = await generateImage(prompts[promptIndex].gemini_prompt, aspectRatio);
      const finalPrompts = [...updatedPrompts];
      finalPrompts[promptIndex] = { 
        ...finalPrompts[promptIndex], 
        isLoading: false, 
        generatedImage: imageUrl || undefined 
      };
      onUpdatePrompts(finalPrompts);
    } catch (e) {
      console.error(e);
      const finalPrompts = [...updatedPrompts];
      finalPrompts[promptIndex] = { ...finalPrompts[promptIndex], isLoading: false };
      onUpdatePrompts(finalPrompts);
    }
  };

  const handleClear = () => {
    onUpdatePrompts([]);
  };

  const downloadImage = (base64: string, title: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `cover-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  const styles: ImageStyle[] = [
    'PHOTOREALISTIC', 'FLAT VECTOR', 'ISOMETRIC', 'SIMPLE CARTOON', 
    'CLAUDE STYLE', '3D RENDER', 'ABSTRACT', 'INFOGRAPHIC', 'CUSTOM'
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 pb-24">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
        <div className="p-8 sm:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Cover Image Architect</h2>
              <p className="text-gray-500 text-sm">Visual concepts powered by Gemini 2.5 Flash</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 ml-1">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  Visual Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {styles.map(s => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                        style === s 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 ml-1">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  Aspect Ratio
                </label>
                <div className="flex gap-2">
                  {['16:9', '4:3', '1:1'].map(r => (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        aspectRatio === r 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 ml-1">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Image Inspiration (Suggestions)
              </label>
              <textarea 
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                rows={5}
                className="w-full flex-1 px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none text-sm transition-all"
                placeholder="Describe specific metaphors, objects, or moods to include in some concepts..."
              />
              <p className="mt-2 text-[10px] text-gray-400 italic flex items-center gap-1.5 ml-1">
                <Info className="w-3 h-3" />
                Suggestions influence 2 of 5 concepts; Gemini innovates the rest.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center pt-8 border-t border-gray-100">
            {prompts.length === 0 ? (
              <AnimatedButton 
                onClick={handleGeneratePrompts}
                disabled={isGeneratingPrompts}
                icon={<RefreshCw className={`w-5 h-5 ${isGeneratingPrompts ? 'animate-spin' : ''}`} />}
              >
                {isGeneratingPrompts ? 'Developing Concepts...' : 'Generate 5 Image Concepts'}
              </AnimatedButton>
            ) : (
              <div className="flex gap-4">
                <button 
                  onClick={handleGeneratePrompts}
                  className="px-6 py-3 bg-white border border-indigo-200 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingPrompts ? 'animate-spin' : ''}`} />
                  Regenerate All
                </button>
                <button 
                  onClick={handleClear}
                  className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Current
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {prompts.map((p, idx) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 relative group overflow-hidden"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-gray-900">{p.title}</h3>
                </div>
                <p className="text-xs text-gray-500 bg-indigo-50 inline-block px-2 py-1 rounded-md">
                  <span className="font-bold">Rationale:</span> {p.rationale}
                </p>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-600 leading-relaxed italic">{p.gemini_prompt}</p>
                </div>
                <button
                  onClick={() => handleGenerateImage(p.id)}
                  disabled={p.isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {p.isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  {p.generatedImage ? 'Regenerate Image' : 'Generate Image'}
                </button>
              </div>

              <div className="w-full md:w-[240px] aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
                {p.isLoading ? (
                  <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Generating...</p>
                  </div>
                ) : p.generatedImage ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative w-full h-full cursor-pointer group/img"
                    onClick={() => setSelectedImage(p.generatedImage!)}
                  >
                    <img src={p.generatedImage} alt={p.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-200" />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/90 backdrop-blur-md" 
              onClick={() => setSelectedImage(null)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button 
                  onClick={() => downloadImage(selectedImage, 'blog-cover')}
                  className="p-3 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg transition-all"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="p-3 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img src={selectedImage} alt="Generated Cover" className="w-full h-auto block" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
