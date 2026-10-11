import React, { useState } from 'react';
import { KnowledgeBase, ChatMode } from '../types';
import {
  MessageSquare,
  BookOpen,
  X,
  ChevronRight,
  Sparkles,
  Globe,
  FolderPlus,
} from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  knowledgeBases: KnowledgeBase[];
  onClose: () => void;
  onCreateChat: (title: string, mode: ChatMode, knowledgeBaseId?: string) => Promise<void>;
  onOpenCreateKb?: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  knowledgeBases,
  onClose,
  onCreateChat,
  onOpenCreateKb,
}) => {
  const [mode, setMode] = useState<ChatMode>(knowledgeBases.length > 0 ? 'rag' : 'general');
  const [selectedKbId, setSelectedKbId] = useState<string>(
    knowledgeBases.length > 0 ? knowledgeBases[0].id : ''
  );
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      let finalTitle = title.trim();
      if (!finalTitle) {
        if (mode === 'rag') {
          const kb = knowledgeBases.find(k => k.id === selectedKbId);
          finalTitle = kb ? `Query: ${kb.name}` : 'Document Q&A';
        } else {
          finalTitle = 'Open Web & LLM Search';
        }
      }

      await onCreateChat(
        finalTitle,
        mode,
        mode === 'rag' ? selectedKbId : undefined
      );
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="liquid-dialog rounded-3xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shadow-md shadow-indigo-500/10">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">New Conversation</h2>
              <p className="text-xs text-slate-400">Query your custom Knowledge Base or search the Open Interweb</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Choose Query Source</label>
            <div className="grid grid-cols-2 gap-3">
              {/* RAG Mode */}
              <button
                type="button"
                onClick={() => setMode('rag')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                  mode === 'rag'
                    ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-500/40'
                    : 'border-white/[0.07] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${mode === 'rag' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/[0.04] text-slate-400'}`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  {mode === 'rag' && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Your Knowledge Base</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Grounded RAG retrieval with precise page citations
                  </div>
                </div>
              </button>

              {/* General / Open Interweb Mode */}
              <button
                type="button"
                onClick={() => setMode('general')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                  mode === 'general'
                    ? 'border-cyan-500 bg-cyan-500/15 text-white shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-500/40'
                    : 'border-white/[0.07] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${mode === 'general' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/[0.04] text-slate-400'}`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  {mode === 'general' && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </div>
                <div>
                  <div className="font-bold text-xs text-white">Open Interweb & AI</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Google Search grounding for live real-time internet knowledge
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* If RAG mode: Select KB */}
          {mode === 'rag' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Target Knowledge Base</label>
                {onOpenCreateKb && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateKb();
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>Create new KB</span>
                  </button>
                )}
              </div>

              {knowledgeBases.length === 0 ? (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-200 space-y-2">
                  <p className="font-medium">You don't have any Knowledge Bases yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Create a knowledge base to upload your PDF documents, or switch to Open Interweb mode above.
                  </p>
                  {onOpenCreateKb && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCreateKb();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      Create Knowledge Base Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {knowledgeBases.map(kb => {
                    const isSelected = selectedKbId === kb.id;
                    return (
                      <button
                        key={kb.id}
                        type="button"
                        onClick={() => setSelectedKbId(kb.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md'
                            : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:border-white/[0.15] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold flex items-center gap-1.5">
                            <span>📚 {kb.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {kb.documentCount} documents • {kb.totalChunks} indexed chunks
                          </div>
                        </div>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Conversation Topic (Optional)</label>
            <input
              type="text"
              placeholder={mode === 'rag' ? 'e.g. Analysis of Q3 Financial Report' : 'e.g. Latest breakthroughs in Quantum Computing'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full liquid-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || (mode === 'rag' && !selectedKbId)}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-white/10"
            >
              {isCreating ? 'Creating Chat...' : 'Start Chat'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
