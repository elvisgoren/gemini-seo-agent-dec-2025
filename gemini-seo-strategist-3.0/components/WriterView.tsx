
import React, { useState } from 'react';
import { PenTool, Sparkles, Copy, Check, MessageSquareText, Loader2, RefreshCw } from 'lucide-react';
import { FormData, ChatMessage } from '../types';
import { BriefChat } from './BriefChat';
import { generateFullArticle, parseMarkdownToHTML } from '../services/geminiService';
import { RichTextEditor } from './RichTextEditor';
import { AnimatedButton } from './AnimatedButton';

interface WriterViewProps {
    brief: string;
    research: string;
    article: string;
    formData: FormData;
    onUpdate: (article: string) => void;
    chatMessages: ChatMessage[];
    setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const WriterView: React.FC<WriterViewProps> = ({ 
    brief, 
    research, 
    article, 
    formData, 
    onUpdate,
    chatMessages,
    setChatMessages
}) => {
    const [instructions, setInstructions] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editorKey, setEditorKey] = useState(0);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const generated = await generateFullArticle(brief, research, formData, instructions);
            onUpdate(generated);
            setEditorKey(prev => prev + 1); // Force editor remount only when new content is generated
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (!article) return;
        const type = "text/html";
        const blob = new Blob([article], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        navigator.clipboard.write(data).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const handleEditorChange = (newContent: string) => {
        onUpdate(newContent);
    };

    return (
        <div className="flex relative overflow-hidden flex-1 bg-gray-50 h-full">
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatOpen ? 'mr-[400px] hidden sm:flex' : ''}`}>
                
                <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20 shadow-sm">
                    <div className="max-w-5xl mx-auto flex justify-between items-center">
                         <div className="flex items-center gap-2">
                             <PenTool className="w-5 h-5 text-green-700" />
                             <div>
                                 <h2 className="font-bold text-gray-900">Content Writer</h2>
                                 {formData.client && (
                                     <p className="text-xs text-gray-500">Writing for: <span className="font-medium text-blue-600">{formData.client}</span></p>
                                 )}
                             </div>
                         </div>
                         
                         <div className="flex items-center gap-2">
                            {article && (
                                <>
                                    <button onClick={handleGenerate} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
                                        <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button onClick={() => setIsChatOpen(!isChatOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
                                        <MessageSquareText className="w-4 h-4" />
                                    </button>
                                    <button onClick={copyToClipboard} className="px-3 py-1.5 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200 flex items-center gap-2 text-sm font-medium">
                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                        Copy HTML
                                    </button>
                                </>
                            )}
                         </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-8">
                    <div className="max-w-4xl mx-auto h-full flex flex-col">
                        {!article && !isGenerating && (
                            <div className="bg-white rounded-xl shadow-xl border border-green-100 p-10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-2xl font-bold text-gray-900 mb-8">Start Writing with Gemini</h3>
                                <textarea 
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-xl focus:border-green-500 outline-none mb-8"
                                    placeholder="Add specific nuances or reminders for this draft..."
                                    rows={4}
                                />
                                <div className="flex justify-center">
                                    <AnimatedButton onClick={handleGenerate} icon={<PenTool className="w-6 h-6" />} variant="green">
                                      Generate Full Article
                                    </AnimatedButton>
                                </div>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center min-h-[500px] flex flex-col items-center justify-center animate-pulse">
                                <Loader2 className="w-20 h-20 text-green-600 animate-spin mb-8" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Gemini is Drafting...</h3>
                            </div>
                        )}

                        {article && !isGenerating && (
                            <div className="flex-1 min-h-[900px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <RichTextEditor 
                                    key={editorKey} 
                                    initialContent={article} 
                                    onChange={handleEditorChange} 
                                />
                            </div>
                        )}
                    </div>
                </div>

                <BriefChat 
                    isOpen={isChatOpen} 
                    onClose={() => setIsChatOpen(false)} 
                    currentBrief={article}
                    formData={formData}
                    onApplyEdit={(newContent) => {
                      onUpdate(parseMarkdownToHTML(newContent));
                    }}
                    contentType="article"
                    messages={chatMessages}
                    setMessages={setChatMessages}
                />
            </div>
        </div>
    );
};
