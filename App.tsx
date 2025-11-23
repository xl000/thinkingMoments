import React, { useState, useEffect, useCallback } from 'react';
import { getNotes, saveNotes } from './services/storageService';
import { translateText, lookupWord } from './services/geminiService';
import { Note, DictionaryResult, ExportFormat } from './types';
import { PlusIcon, SearchIcon, TrashIcon, TranslateIcon, DownloadIcon, XIcon } from './components/Icons';
import { TranslationCard } from './components/TranslationCard';
import { WordModal } from './components/WordModal';

const App: React.FC = () => {
  // Data State
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // UI State
  const [isTranslating, setIsTranslating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Dictionary State
  const [wordModalData, setWordModalData] = useState<DictionaryResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | null>(null);

  // Initialization
  useEffect(() => {
    setNotes(getNotes());
  }, []);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      content: '',
      translations: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNoteId(newNote.id);
    saveNotes(updatedNotes);
    // On mobile, close sidebar when creating note
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = notes.filter(n => n.id !== id);
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
      if (activeNoteId === id) setActiveNoteId(null);
    }
  };

  const handleUpdateContent = (content: string) => {
    if (!activeNoteId) return;
    
    setNotes(prev => {
        const updated = prev.map(n => 
            n.id === activeNoteId 
            ? { ...n, content, updatedAt: Date.now() } 
            : n
        );
        saveNotes(updated);
        return updated;
    });
  };

  const handleTranslate = async () => {
    if (!activeNote || !activeNote.content.trim()) return;

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const results = await translateText(activeNote.content);
      
      setNotes(prev => {
          const updated = prev.map(n => 
              n.id === activeNoteId 
              ? { ...n, translations: results, updatedAt: Date.now() } 
              : n
          );
          saveNotes(updated);
          return updated;
      });
    } catch (error: any) {
      console.error("Translation failed", error);
      setTranslationError("Failed to translate. Please check your network connection.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleWordClick = useCallback(async (word: string, context: string, e: React.MouseEvent) => {
    // Calculate modal position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY
    });
    
    setWordModalData(null);
    setIsLookingUp(true);

    try {
      const result = await lookupWord(word, context);
      setWordModalData(result);
    } catch (error) {
      console.error("Lookup failed", error);
      // Fallback or simple error in modal
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  const handleExport = (format: ExportFormat) => {
    if (!activeNote) return;

    let content = '';
    const date = new Date(activeNote.createdAt).toLocaleDateString();

    if (format === 'txt') {
        content = `Original (${date}):\n${activeNote.content}\n\n`;
        activeNote.translations.forEach(t => {
            content += `[${t.level}]\n${t.text}\n\n`;
        });
    } else if (format === 'json') {
        content = JSON.stringify(activeNote, null, 2);
    } else if (format === 'md') {
        content = `# Translation Note - ${date}\n\n## Original\n${activeNote.content}\n\n`;
        activeNote.translations.forEach(t => {
            content += `### ${t.level} Version\n${t.text}\n\n**Keywords:** ${t.keywords.join(', ')}\n\n`;
        });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${date}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredNotes = notes
    .filter(n => n.content.includes(searchQuery) || n.translations.some(t => t.text.includes(searchQuery)))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden fixed bottom-4 right-4 z-30 bg-brand-600 text-white p-3 rounded-full shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <XIcon className="w-6 h-6"/> : <span className="font-bold">Menu</span>}
      </button>

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-20 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600">
                        Thought Note
                    </h1>
                </div>
                
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search notes..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                </div>
            </div>

            {/* Note List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <button 
                    onClick={handleCreateNote}
                    className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all group"
                >
                    <PlusIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">New Note</span>
                </button>

                {filteredNotes.map(note => (
                    <div 
                        key={note.id}
                        onClick={() => { setActiveNoteId(note.id); if(window.innerWidth<768) setSidebarOpen(false); }}
                        className={`
                            group relative p-3 rounded-lg cursor-pointer transition-all border
                            ${activeNoteId === note.id 
                                ? 'bg-white border-brand-500 shadow-md ring-1 ring-brand-500/20' 
                                : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'
                            }
                        `}
                    >
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                            {note.content || <span className="text-gray-400 italic">Empty thought...</span>}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                            {note.translations.length > 0 && (
                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    Done
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={(e) => handleDeleteNote(e, note.id)}
                            className="absolute right-2 top-2 p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {activeNote ? (
            <>
                {/* Editor Header */}
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="text-sm text-gray-500">
                        {new Date(activeNote.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="relative group">
                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center space-x-1">
                                <DownloadIcon className="w-4 h-4" />
                                <span className="text-xs font-medium">Export</span>
                            </button>
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover:block z-10 py-1">
                                {(['txt', 'json', 'md'] as ExportFormat[]).map(fmt => (
                                    <button 
                                        key={fmt}
                                        onClick={() => handleExport(fmt)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 uppercase"
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
                    {/* Input Section */}
                    <div className="max-w-3xl mx-auto space-y-4">
                        <label className="block text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Chinese Thought
                        </label>
                        <textarea
                            value={activeNote.content}
                            onChange={(e) => handleUpdateContent(e.target.value)}
                            placeholder="What's on your mind? (Write in Chinese)"
                            className="w-full min-h-[120px] text-lg bg-transparent border-none focus:ring-0 p-0 text-gray-800 placeholder-gray-300 resize-none leading-relaxed"
                            autoFocus
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleTranslate}
                                disabled={isTranslating || !activeNote.content.trim()}
                                className={`
                                    flex items-center space-x-2 px-6 py-2.5 rounded-full font-medium shadow-sm transition-all
                                    ${isTranslating || !activeNote.content.trim()
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md active:scale-95'
                                    }
                                `}
                            >
                                {isTranslating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Translating...</span>
                                    </>
                                ) : (
                                    <>
                                        <TranslateIcon className="w-4 h-4" />
                                        <span>Translate</span>
                                    </>
                                )}
                            </button>
                        </div>
                        {translationError && (
                            <p className="text-red-500 text-sm text-right bg-red-50 p-2 rounded inline-block float-right clear-both">
                                {translationError}
                            </p>
                        )}
                    </div>

                    {/* Output Section */}
                    {activeNote.translations.length > 0 && (
                        <div className="max-w-3xl mx-auto border-t border-gray-200 pt-8 space-y-6 pb-20">
                            {activeNote.translations.map((item, idx) => (
                                <TranslationCard 
                                    key={idx} 
                                    item={item} 
                                    onWordClick={handleWordClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">💭</span>
                </div>
                <h2 className="text-xl font-medium text-gray-600 mb-2">Ready to capture your thoughts?</h2>
                <p className="max-w-sm mb-8">Select a note from the sidebar or create a new one to start practicing your English expression.</p>
                <button 
                    onClick={handleCreateNote}
                    className="bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
                >
                    Create First Note
                </button>
            </div>
        )}

        {/* Floating Modals */}
        <WordModal 
            data={wordModalData}
            loading={isLookingUp}
            position={modalPosition}
            onClose={() => {
                setWordModalData(null);
                setModalPosition(null);
                setIsLookingUp(false);
            }}
        />
      </main>
    </div>
  );
};

export default App;