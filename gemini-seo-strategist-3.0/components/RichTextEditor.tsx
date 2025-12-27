
import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, Pilcrow,
  List, ListOrdered, Quote, Code,
  Link, Unlink, Minus, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight,
  Sparkles, Check, Type
} from 'lucide-react';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  isReadOnly?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent, onChange, isReadOnly = false }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // FIXED: Only initialize content ONCE, not on every prop change
  useEffect(() => {
    if (editorRef.current && initialContent && !hasInitialized.current) {
      editorRef.current.innerHTML = initialContent;
      hasInitialized.current = true;
      updateCounts();
    }
  }, [initialContent]);

  // Reset initialization when content is cleared (e.g., new article generation)
  useEffect(() => {
    if (!initialContent) {
      hasInitialized.current = false;
    }
  }, [initialContent]);

  const updateCounts = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      setWordCount(words.length);
      setCharCount(text.length);
    }
  };

  const updateActiveFormats = () => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('strikeThrough')) formats.add('strikethrough');
    if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
    if (document.queryCommandState('insertOrderedList')) formats.add('ol');
    setActiveFormats(formats);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html === '<br>' ? '' : html);
      updateCounts();
      setLastSaved(new Date());
    }
  };

  const handleSelectionChange = () => {
    updateActiveFormats();
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const execCommand = (command: string, value?: string) => {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    
    if (editorRef.current) {
      editorRef.current.focus();
      
      if (range) {
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      
      document.execCommand(command, false, value);
      handleInput();
      updateActiveFormats();
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const removeLink = () => {
    execCommand('unlink');
  };

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    label, 
    isActive = false,
    variant = 'default'
  }: { 
    onClick: () => void; 
    icon: any; 
    label: string; 
    isActive?: boolean;
    variant?: 'default' | 'heading';
  }) => (
    <button
      onMouseDown={(e) => {
        e.preventDefault(); // Prevents focus from leaving editor
        onClick();
      }}
      title={label}
      disabled={isReadOnly}
      className={`
        relative p-2 rounded-lg transition-all duration-200 group
        ${isActive 
          ? 'bg-blue-100 text-blue-700 shadow-sm' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }
        ${variant === 'heading' ? 'font-bold' : ''}
        active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
      `}
    >
      <Icon className="w-4 h-4" />
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </span>
    </button>
  );

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-200 mx-1" />
  );

  return (
    <div className={`
      bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 overflow-hidden flex flex-col h-full
      ${isFocused 
        ? 'border-blue-400 shadow-lg shadow-blue-100/50 ring-4 ring-blue-50' 
        : 'border-gray-200 hover:border-gray-300'
      }
    `}>
      
      {/* Toolbar */}
      {!isReadOnly && (
        <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 p-2 sticky top-0 z-10">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Text Style Group */}
            <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
              <ToolbarButton 
                onClick={() => execCommand('bold')} 
                icon={Bold} 
                label="Bold (⌘B)"
                isActive={activeFormats.has('bold')}
              />
              <ToolbarButton 
                onClick={() => execCommand('italic')} 
                icon={Italic} 
                label="Italic (⌘I)"
                isActive={activeFormats.has('italic')}
              />
              <ToolbarButton 
                onClick={() => execCommand('underline')} 
                icon={Underline} 
                label="Underline (⌘U)"
                isActive={activeFormats.has('underline')}
              />
              <ToolbarButton 
                onClick={() => execCommand('strikeThrough')} 
                icon={Strikethrough} 
                label="Strikethrough"
                isActive={activeFormats.has('strikethrough')}
              />
            </div>

            <ToolbarDivider />

            {/* Headings Group */}
            <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
              <ToolbarButton onClick={() => formatBlock('h1')} icon={Heading1} label="Heading 1" />
              <ToolbarButton onClick={() => formatBlock('h2')} icon={Heading2} label="Heading 2" />
              <ToolbarButton onClick={() => formatBlock('h3')} icon={Heading3} label="Heading 3" />
              <ToolbarButton onClick={() => formatBlock('p')} icon={Pilcrow} label="Paragraph" />
            </div>

            <ToolbarDivider />

            {/* Lists & Structure Group */}
            <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
              <ToolbarButton 
                onClick={() => execCommand('insertUnorderedList')} 
                icon={List} 
                label="Bullet List"
                isActive={activeFormats.has('ul')}
              />
              <ToolbarButton 
                onClick={() => execCommand('insertOrderedList')} 
                icon={ListOrdered} 
                label="Numbered List"
                isActive={activeFormats.has('ol')}
              />
              <ToolbarButton onClick={() => formatBlock('blockquote')} icon={Quote} label="Quote" />
              <ToolbarButton onClick={() => execCommand('insertHorizontalRule')} icon={Minus} label="Horizontal Rule" />
            </div>

            <ToolbarDivider />

            {/* Link Group */}
            <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm relative">
              <ToolbarButton 
                onClick={() => setShowLinkInput(!showLinkInput)} 
                icon={Link} 
                label="Insert Link"
              />
              <ToolbarButton 
                onClick={removeLink} 
                icon={Unlink} 
                label="Remove Link"
              />
              
              {showLinkInput && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && insertLink()}
                      autoFocus
                    />
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={insertLink}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ToolbarDivider />

            {/* Alignment Group */}
            <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
              <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={AlignLeft} label="Align Left" />
              <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={AlignCenter} label="Align Center" />
              <ToolbarButton onClick={() => execCommand('justifyRight')} icon={AlignRight} label="Align Right" />
            </div>

            <ToolbarDivider />

            {/* Undo/Redo Group */}
            <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
              <ToolbarButton onClick={() => execCommand('undo')} icon={Undo} label="Undo (⌘Z)" />
              <ToolbarButton onClick={() => execCommand('redo')} icon={Redo} label="Redo (⌘⇧Z)" />
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
              <span className="flex items-center gap-1">
                <Type className="w-3 h-3" />
                {wordCount.toLocaleString()} words
              </span>
              <span className="w-px h-3 bg-gray-300" />
              <span>{charCount.toLocaleString()} chars</span>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div 
        ref={editorRef}
        contentEditable={!isReadOnly}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="
          flex-1 min-h-[600px] p-8 sm:p-12 
          prose prose-lg max-w-none
          focus:outline-none overflow-y-auto
          
          prose-headings:font-bold prose-headings:text-gray-900
          prose-h1:text-3xl prose-h1:mb-6 prose-h1:pb-3 prose-h1:border-b prose-h1:border-gray-100
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-blue-900
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-gray-800
          
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
          
          prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline 
          hover:prose-a:underline prose-a:transition-colors
          
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-em:text-gray-800
          
          prose-ul:my-4 prose-ul:pl-6
          prose-ol:my-4 prose-ol:pl-6
          prose-li:my-1 prose-li:text-gray-700
          
          prose-blockquote:border-l-4 prose-blockquote:border-blue-400 
          prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:px-6 
          prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-600
          
          prose-hr:my-8 prose-hr:border-gray-200
          
          prose-table:my-6 prose-table:w-full
          prose-th:bg-gray-50 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:border-b-2
          prose-td:p-3 prose-td:border-b prose-td:border-gray-100
        "
        data-placeholder="Start writing your article here..."
        suppressContentEditableWarning={true}
      />

      <div className="bg-gradient-to-t from-gray-50 to-white border-t border-gray-100 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {lastSaved && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Auto-saved
              </span>
              <span>·</span>
              <span>{lastSaved.toLocaleTimeString()}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>AI-Generated Draft</span>
        </div>
      </div>

      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
          font-style: italic;
        }
        [data-placeholder]:empty:focus:before {
          color: #d1d5db;
        }
        
        [contenteditable]::selection {
          background: rgba(59, 130, 246, 0.2);
        }
        
        [contenteditable]::-webkit-scrollbar {
          width: 8px;
        }
        [contenteditable]::-webkit-scrollbar-track {
          background: transparent;
        }
        [contenteditable]::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        [contenteditable]::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};
