
import React, { useState } from 'react';
import { ArrowLeft, Copy, Download, Eye, Code, Check, MessageSquareText, LibraryBig, Sparkles, Loader2, Search, ExternalLink } from 'lucide-react';
import { DisplayMode, FormData, BriefTab, ChatMessage, GroundingLink } from '../types';
import { BriefChat } from './BriefChat';
import { performDeepResearch, generateResearchFramework } from '../services/geminiService';
import { AnimatedButton } from './AnimatedButton';

interface BriefViewProps {
  brief: string;
  research?: string;
  onBack: () => void;
  clientName: string;
  keyword: string;
  formData: FormData;
  onUpdate: (brief: string, research?: string) => void;
  activeTab: BriefTab; 
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const BriefView: React.FC<BriefViewProps> = ({ 
  brief, 
  research, 
  onBack, 
  clientName, 
  keyword, 
  formData, 
  onUpdate, 
  activeTab,
  chatMessages,
  setChatMessages
}) => {
  const [currentBrief, setCurrentBrief] = useState(brief);
  const [currentResearch, setCurrentResearch] = useState(research || '');
  const [groundingLinks, setGroundingLinks] = useState<GroundingLink[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('formatted');
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchPhase, setResearchPhase] = useState<'idle' | 'framework' | 'evidence'>('idle');

  const copyToClipboard = () => {
    const textToCopy = activeTab === 'strategy' ? currentBrief : currentResearch;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsMarkdown = () => {
    const markdownContent = `# SEO Content Brief
## Client: ${clientName}
## Target Keyword: ${keyword}
## Generated: ${new Date().toLocaleString()}

---

# Strategic Brief

${currentBrief}

---

# Research Dossier

${currentResearch || 'Research not yet completed.'}
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientName}-${keyword}-brief.md`.replace(/\s+/g, '-').toLowerCase();
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunResearch = async () => {
    setIsResearching(true);
    setResearchPhase('framework');
    
    try {
      const framework = await generateResearchFramework(currentBrief, formData);
      setResearchPhase('evidence');
      const { text: evidence, links } = await performDeepResearch(currentBrief, formData, framework);
      
      const fullDossier = `# Research Dossier: ${formData.targetKeyword}
## Client: ${formData.client}
## Generated: ${new Date().toLocaleDateString()}

---

# Part 1: Research Framework & Topic Analysis

${framework}

---

# Part 2: Verified Evidence & Citations

${evidence}
`;
      
      setCurrentResearch(fullDossier);
      setGroundingLinks(links);
      onUpdate(currentBrief, fullDossier);
      
    } catch (e) {
      console.error("Research failed", e);
      setCurrentResearch("Research generation failed. Please try again.");
    } finally {
      setIsResearching(false);
      setResearchPhase('idle');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (activeTab === 'strategy') {
          setCurrentBrief(newValue);
          onUpdate(newValue, currentResearch);
      } else {
          setCurrentResearch(newValue);
          onUpdate(currentBrief, newValue);
      }
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '';
    let html = text
      .replace(/^#### (.*$)/gm, '<h4 class="text-base font-semibold mb-2 mt-4 text-gray-800">$1</h4>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mb-3 mt-6 text-gray-900 border-l-4 border-purple-500 pl-3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-4 mt-8 text-blue-900 border-b pb-2 flex items-center gap-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-extrabold mb-6 text-gray-900">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-800">$1</em>')
      .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-2 text-gray-700 relative pl-2"><span class="absolute left-[-1rem] top-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full"></span>$1</li>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 mb-2 text-gray-700 relative pl-2"><span class="absolute left-[-1rem] top-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full"></span>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-2 text-gray-700 list-decimal">$1</li>') 
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5">$1<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>')
      .replace(/(?<!href=")(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline break-all">$1</a>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/\n/g, '<br>');

    return `<p class="mb-4 text-gray-700 leading-relaxed">${html}</p>`;
  };

  return (
    <div className="flex relative overflow-hidden flex-1 bg-gray-50">
      <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-[400px] hidden sm:block' : ''}`}>
        
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center">
                        <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                                {activeTab === 'strategy' ? 'Strategy Brief' : 'Research Dossier'}
                            </h1>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                <span className="font-medium text-gray-700 mr-1.5">{clientName}</span>
                                <span className="text-gray-300 mx-1">•</span>
                                <span className="mr-1.5">{formData.seoTitle || keyword}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <div className="flex bg-gray-100/80 rounded-lg p-1 mr-2 border border-gray-200">
                            <button 
                            onClick={() => setDisplayMode('formatted')} 
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center ${displayMode === 'formatted' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />Preview
                            </button>
                            <button 
                            onClick={() => setDisplayMode('markdown')} 
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center ${displayMode === 'markdown' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                            <Code className="w-3.5 h-3.5 mr-1.5" />Edit Source
                            </button>
                        </div>

                        <button 
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={`px-3 py-2 ${isChatOpen ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-200'} border rounded-lg text-sm font-medium transition-all flex items-center hover:bg-gray-50`}
                        >
                            <MessageSquareText className="w-4 h-4 mr-1.5" />
                            Ask AI
                        </button>

                        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                        <button 
                            onClick={copyToClipboard} 
                            className={`px-3 py-2 ${copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'} border rounded-lg text-sm font-medium transition-all flex items-center`}
                        >
                            {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        
                        <button 
                            onClick={exportAsMarkdown} 
                            className="px-3 py-2 bg-gray-900 text-white border border-gray-900 rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors flex items-center shadow-sm"
                        >
                            <Download className="w-4 h-4 mr-1.5" />Export
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-gray-50/50 min-h-[calc(100vh-180px)]">
            <div className="max-w-5xl mx-auto p-4 sm:p-8">
                {activeTab === 'strategy' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {displayMode === 'formatted' ? (
                            <article className="p-8 sm:p-12 prose prose-blue max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(currentBrief) }} />
                            </article>
                        ) : (
                            <div className="relative group">
                                <textarea 
                                    className="w-full h-[80vh] p-8 font-mono text-sm text-gray-800 bg-gray-50 rounded-xl resize-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={currentBrief}
                                    onChange={handleTextChange}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'research' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {!currentResearch && !isResearching && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
                                <Search className="w-12 h-12 text-purple-600 mb-6" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">Deep Research Assistant</h2>
                                <AnimatedButton 
                                    onClick={handleRunResearch}
                                    icon={<Sparkles className="w-5 h-5" />}
                                    variant="purple"
                                >
                                  Run Deep Research
                                </AnimatedButton>
                            </div>
                        )}

                        {isResearching && (
                          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
                            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-6" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {researchPhase === 'framework' 
                                ? 'Phase 1: Building Research Framework' 
                                : 'Phase 2: Gathering Verified Evidence'}
                            </h3>
                            <p className="text-gray-500 mb-6 max-w-md italic">Powered by Gemini 3 Pro + Google Search Grounding</p>
                          </div>
                        )}

                        {currentResearch && !isResearching && (
                            <div className="space-y-6">
                              <div className="bg-white rounded-xl shadow-sm border border-purple-100 min-h-[600px]">
                                  {displayMode === 'formatted' ? (
                                      <article className="p-8 sm:p-12 prose prose-purple max-w-none">
                                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(currentResearch) }} />
                                      </article>
                                  ) : (
                                      <textarea 
                                          className="w-full h-[80vh] p-8 font-mono text-sm text-gray-800 bg-gray-50 rounded-xl resize-none focus:outline-none transition-all"
                                          value={currentResearch}
                                          onChange={handleTextChange}
                                      />
                                  )}
                              </div>

                              {groundingLinks.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                  <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ExternalLink className="w-4 h-4 text-blue-600" />
                                    Grounding Sources
                                  </h3>
                                  <div className="flex flex-wrap gap-3">
                                    {groundingLinks.map((link, i) => (
                                      <a 
                                        key={i} 
                                        href={link.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-1.5"
                                      >
                                        <span className="font-medium text-gray-700 truncate max-w-[200px]">{link.title}</span>
                                        <ExternalLink className="w-3 h-3 text-gray-400" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <BriefChat 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            currentBrief={activeTab === 'strategy' ? currentBrief : currentResearch}
            formData={formData}
            onApplyEdit={(newContent) => {
              if (activeTab === 'strategy') {
                setCurrentBrief(newContent);
                onUpdate(newContent, currentResearch);
              } else {
                setCurrentResearch(newContent);
                onUpdate(currentBrief, newContent);
              }
            }}
            contentType={activeTab === 'strategy' ? 'brief' : 'research'}
            messages={chatMessages}
            setMessages={setChatMessages}
        />
      </div>
    </div>
  );
};
