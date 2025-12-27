
import React, { useState, useEffect } from 'react';
import { Menu, History, Brain, Sparkles, AlertCircle, X, Users, ChevronDown, Search, Save, FileText, LibraryBig, PenTool, Plus, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData, ViewState, BriefHistoryItem, Client, BriefTab, CompetitorAnalysis, ChatMessage, ImagePrompt } from './types';
import { generateSEOBrief, analyzeCompetitorUrls } from './services/geminiService';
import { LoadingOverlay } from './components/LoadingOverlay';
import { HistoryView } from './components/HistoryView';
import { BriefView } from './components/BriefView';
import { WriterView } from './components/WriterView';
import { ClientsView } from './components/ClientsView';
import { CoverImageView } from './components/CoverImageView';
import { PillNav } from './components/PillNav';
import { AnimatedButton } from './components/AnimatedButton';

const INITIAL_FORM_STATE: FormData = {
  client: '',
  companyBrief: '',
  brandGuidelines: '',
  targetKeyword: '',
  seoTitle: '',
  articleDirection: '',
  wordCountTarget: '1500',
  competitorUrls: '',
  paaQuestions: '',
  location: 'United States',
  contentType: 'Blog Post',
  authorInfo: ''
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('input');
  const [activeTab, setActiveTab] = useState<BriefTab>('strategy');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [history, setHistory] = useState<BriefHistoryItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [currentBrief, setCurrentBrief] = useState<string>('');
  const [currentResearch, setCurrentResearch] = useState<string>(''); 
  const [currentArticle, setCurrentArticle] = useState<string>('');
  const [currentImagePrompts, setCurrentImagePrompts] = useState<ImagePrompt[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('seo_brief_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
    const savedClients = localStorage.getItem('seo_brief_clients');
    if (savedClients) {
        try { setClients(JSON.parse(savedClients)); } catch(e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('seo_brief_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('seo_brief_clients', JSON.stringify(clients));
  }, [clients]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddClient = (newClient: Client) => {
      setClients(prev => [...prev, newClient]);
  };
  
  const handleDeleteClient = (id: string) => {
      setClients(prev => prev.filter(c => c.id !== id));
  };

  const handleClientSelect = (clientId: string) => {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
          setFormData(prev => ({
              ...prev,
              client: selectedClient.name,
              companyBrief: selectedClient.brief,
              brandGuidelines: selectedClient.brandGuidelines || ''
          }));
      }
  };

  const handleSaveCurrentClient = () => {
      if (!formData.client.trim()) {
          setError("Please enter a Client Name to save.");
          setTimeout(() => setError(null), 3000);
          return;
      }
      const newClient: Client = {
          id: Date.now().toString(),
          name: formData.client,
          brief: formData.companyBrief,
          brandGuidelines: formData.brandGuidelines
      };
      setClients(prev => [...prev, newClient]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleGenerate = async () => {
    if (!formData.targetKeyword) {
        setError("Target Keyword is required.");
        setTimeout(() => setError(null), 3000);
        return;
    }
    setIsGenerating(true);
    setGenerationStatus('Analyzing competitors and creating brief...');
    setError(null);

    try {
      let competitorAnalysis: CompetitorAnalysis[] = [];
      const urlsToProcess = formData.competitorUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
      if (urlsToProcess.length > 0) {
        competitorAnalysis = await analyzeCompetitorUrls(urlsToProcess.slice(0, 5));
      }
      
      const { text: generatedBrief, links } = await generateSEOBrief(formData, competitorAnalysis);
      
      setCurrentBrief(generatedBrief);
      setCurrentResearch(''); 
      setCurrentArticle('');
      setCurrentImagePrompts([]);
      setChatMessages([]);
      
      const newHistoryItem: BriefHistoryItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        client: formData.client || 'Untitled',
        keyword: formData.targetKeyword,
        brief: generatedBrief,
        research: '',
        article: '',
        imagePrompts: [],
        groundingLinks: links
      };
      
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 20)); 
      setView('brief');
      setActiveTab('strategy');
    } catch (err: any) {
      console.error(err);
      setError("Generation failed. Please verify your connection or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateBrief = (brief: string, research?: string, article?: string, prompts?: ImagePrompt[]) => {
    setCurrentBrief(brief);
    if (research !== undefined) setCurrentResearch(research);
    if (article !== undefined) setCurrentArticle(article);
    if (prompts !== undefined) setCurrentImagePrompts(prompts);

    setHistory(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const idx = updated.findIndex(h => h.keyword === formData.targetKeyword);
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          brief,
          ...(research !== undefined && { research }),
          ...(article !== undefined && { article }),
          ...(prompts !== undefined && { imagePrompts: prompts })
        };
      }
      return updated;
    });
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 overflow-x-hidden relative">
      {isGenerating && <LoadingOverlay status={generationStatus} />}

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm" 
              onClick={() => setIsMenuOpen(false)} 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 z-[60]"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Workspace</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <nav className="space-y-2">
                <button onClick={() => { setView('clients'); setIsMenuOpen(false); }} className="flex items-center w-full p-4 text-left text-gray-700 hover:bg-blue-600 hover:text-white rounded-2xl transition-all font-medium group">
                  <Users className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  Manage Clients
                </button>
                <button onClick={() => { setView('history'); setIsMenuOpen(false); }} className="flex items-center w-full p-4 text-left text-gray-700 hover:bg-blue-600 hover:text-white rounded-2xl transition-all font-medium group">
                  <History className="w-5 h-5 mr-3 group-hover:rotate-[-45deg] transition-transform" />
                  Brief History
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="bg-white/70 backdrop-blur-md border-b sticky top-0 z-30 transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setView('input')}
            >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Gemini SEO <span className="text-blue-600">Strategist 3</span></h1>
            </motion.div>
            
            <div className="flex items-center">
                {currentBrief && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { 
                      setCurrentBrief(''); 
                      setCurrentResearch(''); 
                      setCurrentArticle(''); 
                      setCurrentImagePrompts([]);
                      setChatMessages([]);
                      setView('input'); 
                      setActiveTab('strategy'); 
                    }} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-semibold mr-2 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    New Project
                  </motion.button>
                )}
                <button 
                  onClick={() => setIsMenuOpen(true)} 
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"
                >
                  <Menu className="w-6 h-6" />
                </button>
            </div>
        </div>
      </header>

      <PillNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        disabledTabs={{ 
          research: !currentBrief, 
          writer: !currentResearch,
          cover: !currentArticle
        }} 
      />

      <main className="relative z-10 py-6">
        <AnimatePresence mode="wait">
          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <HistoryView 
                  history={history} 
                  onSelect={(item) => { 
                      setCurrentBrief(item.brief); 
                      setCurrentResearch(item.research || ''); 
                      setCurrentArticle(item.article || '');
                      setCurrentImagePrompts(item.imagePrompts || []);
                      setChatMessages([]);
                      setFormData(prev => ({...prev, client: item.client, targetKeyword: item.keyword}));
                      setView('brief'); 
                      setActiveTab('strategy');
                  }} 
                  onBack={() => setView('input')} 
              />
            </motion.div>
          )}

          {view === 'clients' && (
            <motion.div
              key="clients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ClientsView clients={clients} onAddClient={handleAddClient} onDeleteClient={handleDeleteClient} onBack={() => setView('input')} />
            </motion.div>
          )}

          {view === 'input' && activeTab === 'strategy' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 px-6 py-10 sm:px-12 border-b border-gray-100">
                      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Strategy Architect</h2>
                      <p className="text-gray-500 mt-2 text-lg">Harness Gemini 3 Pro to design your content strategy.</p>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mx-6 mt-6 bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl flex items-center shadow-sm"
                    >
                      <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="font-medium">{error}</span>
                    </motion.div>
                  )}

                  <div className="p-8 sm:p-12 space-y-12">
                      <section>
                          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest">01. Identity</h3>
                            <select 
                              onChange={(e) => handleClientSelect(e.target.value)} 
                              className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-full text-xs font-semibold hover:border-blue-400 outline-none transition-all cursor-pointer shadow-sm"
                              defaultValue=""
                            >
                              <option value="" disabled>Load Existing Client...</option>
                              {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Client Name</label>
                                <div className="flex items-center gap-3">
                                  <input type="text" value={formData.client} onChange={(e) => handleInputChange('client', e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. Acme Tech"/>
                                  <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSaveCurrentClient} 
                                    className={`p-3.5 rounded-2xl border transition-all ${saveSuccess ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-400 hover:text-blue-600 shadow-sm'}`}
                                  >
                                    {saveSuccess ? <Sparkles className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                                  </motion.button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Market Location</label>
                                <input type="text" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="e.g. London, UK"/>
                              </div>
                          </div>
                          <div className="mt-8">
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Company Context & Brand</label>
                            <textarea value={formData.companyBrief} onChange={(e) => handleInputChange('companyBrief', e.target.value)} rows={3} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all" placeholder="What do they do? What is their unique tone?"/>
                          </div>
                      </section>

                      <section>
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">02. Search Strategy</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Primary Keyword *</label>
                              <input type="text" value={formData.targetKeyword} onChange={(e) => handleInputChange('targetKeyword', e.target.value)} className="w-full px-5 py-3.5 bg-white border-2 border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all text-lg font-medium" placeholder="Best SaaS SEO Tool 2025"/>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Proposed SEO Title</label>
                              <input type="text" value={formData.seoTitle} onChange={(e) => handleInputChange('seoTitle', e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="Catchy title..."/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Word Count Target</label>
                              <select value={formData.wordCountTarget} onChange={(e) => handleInputChange('wordCountTarget', e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all cursor-pointer">
                                <option value="800">~800 Words</option>
                                <option value="1200">~1,200 Words</option>
                                <option value="1500">~1,500 Words</option>
                                <option value="2500">2,500+ Words</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Content Type</label>
                              <input type="text" value={formData.contentType} onChange={(e) => handleInputChange('contentType', e.target.value)} className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all" placeholder="Guide, News, Review..."/>
                            </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3 flex items-center">
                          <Search className="w-4 h-4 mr-2" />
                          03. Search Grounding
                        </h3>
                        <div className="mb-8">
                          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Competitor URLs (for intent analysis)</label>
                          <textarea value={formData.competitorUrls} onChange={(e) => handleInputChange('competitorUrls', e.target.value)} rows={3} className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none text-xs font-mono transition-all" placeholder="Paste ranking URLs to see why they are winning..."/>
                        </div>
                      </section>

                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-10 border-t border-gray-100 flex flex-col items-center"
                      >
                          <AnimatedButton 
                            onClick={handleGenerate}
                            disabled={isGenerating || !formData.targetKeyword}
                            icon={<Sparkles className="w-6 h-6" />}
                          >
                            {isGenerating ? 'Analyzing...' : 'Generate Full SEO Strategy'}
                          </AnimatedButton>
                          <p className="mt-4 text-xs text-gray-400 font-medium">Gemini 3 Pro • Real-time competitive grounding active</p>
                      </motion.div>
                  </div>
              </div>
            </motion.div>
          )}

          {currentBrief && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {activeTab === 'strategy' && (
                <BriefView 
                  brief={currentBrief} research={currentResearch} onBack={() => { setCurrentBrief(''); setView('input'); }} 
                  clientName={formData.client} keyword={formData.targetKeyword} formData={formData}
                  onUpdate={(b, r) => handleUpdateBrief(b, r, currentArticle, currentImagePrompts)} activeTab='strategy'
                  chatMessages={chatMessages} setChatMessages={setChatMessages}
                />
              )}

              {activeTab === 'research' && (
                <BriefView 
                  brief={currentBrief} research={currentResearch} onBack={() => setActiveTab('strategy')} 
                  clientName={formData.client} keyword={formData.targetKeyword} formData={formData}
                  onUpdate={(b, r) => handleUpdateBrief(b, r, currentArticle, currentImagePrompts)} activeTab='research'
                  chatMessages={chatMessages} setChatMessages={setChatMessages}
                />
              )}

              {activeTab === 'writer' && (
                <WriterView 
                  brief={currentBrief} research={currentResearch} article={currentArticle}
                  formData={formData} onUpdate={(a) => handleUpdateBrief(currentBrief, currentResearch, a, currentImagePrompts)}
                  chatMessages={chatMessages} setChatMessages={setChatMessages}
                />
              )}

              {activeTab === 'cover' && (
                <CoverImageView 
                  article={currentArticle || currentBrief}
                  formData={formData}
                  prompts={currentImagePrompts}
                  onUpdatePrompts={(p) => handleUpdateBrief(currentBrief, currentResearch, currentArticle, p)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
