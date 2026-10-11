import React, { useState } from 'react';
import { KnowledgeBase, DocumentRecord } from '../types';
import {
  Folder,
  Plus,
  FileText,
  Trash2,
  UploadCloud,
  MessageSquare,
  BookOpen,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface KnowledgeBaseManagerProps {
  knowledgeBases: KnowledgeBase[];
  documents: DocumentRecord[];
  onCreateKb: (name: string, description: string) => Promise<void>;
  onDeleteKb: (id: string) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
  onOpenUpload: (kbId: string) => void;
  onOpenDocument: (doc: DocumentRecord) => void;
  onStartRagChat: (kbId: string) => void;
}

export const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  knowledgeBases,
  documents,
  onCreateKb,
  onDeleteKb,
  onDeleteDocument,
  onOpenUpload,
  onOpenDocument,
  onStartRagChat,
}) => {
  const [selectedKbId, setSelectedKbId] = useState<string>(
    knowledgeBases.length > 0 ? knowledgeBases[0].id : ''
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbDesc, setNewKbDesc] = useState('');

  const activeKb =
    knowledgeBases.find(k => k.id === selectedKbId) || knowledgeBases[0];

  const kbDocs = activeKb
    ? documents.filter(d => d.knowledgeBaseId === activeKb.id)
    : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbName.trim()) return;
    await onCreateKb(newKbName.trim(), newKbDesc.trim());
    setNewKbName('');
    setNewKbDesc('');
    setIsCreating(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shadow-md shadow-indigo-500/10">
              <Folder className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Your Knowledge Bases</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create domain-specific corpora, upload PDF documents, and ground your AI chats with exact page references.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 self-start sm:self-auto border border-white/10"
        >
          <Plus className="w-4 h-4" />
          <span>New Knowledge Base</span>
        </button>
      </div>

      {/* Create KB Dialogue / Form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="liquid-dialog rounded-3xl p-6 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Create New Knowledge Base</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 block">Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Distributed Computing Notes"
                value={newKbName}
                onChange={e => setNewKbName(e.target.value)}
                className="w-full liquid-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1.5 block">Description</label>
              <input
                type="text"
                placeholder="e.g. Papers on consensus, leader election, and Paxos"
                value={newKbDesc}
                onChange={e => setNewKbDesc(e.target.value)}
                className="w-full liquid-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-2xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20"
            >
              Save Knowledge Base
            </button>
          </div>
        </form>
      )}

      {/* Empty State for New Users */}
      {knowledgeBases.length === 0 && !isCreating && (
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 my-6 border border-white/[0.08]">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/10">
            <Folder className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Welcome to your Personal Knowledge Studio</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
              Yama AI lets you upload your own textbooks, research papers, notes, or company manuals. We extract every page, perform semantic chunking, and generate 768-dimensional dense vector embeddings for precision retrieval.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="liquid-glass-card rounded-2xl p-4 space-y-1">
              <div className="text-xs font-bold text-indigo-300">1. Create Base</div>
              <p className="text-[11px] text-slate-400">Name your repository for a topic or course.</p>
            </div>
            <div className="liquid-glass-card rounded-2xl p-4 space-y-1">
              <div className="text-xs font-bold text-indigo-300">2. Ingest PDFs</div>
              <p className="text-[11px] text-slate-400">Upload documents with automatic page retention.</p>
            </div>
            <div className="liquid-glass-card rounded-2xl p-4 space-y-1">
              <div className="text-xs font-bold text-indigo-300">3. Grounded Q&A</div>
              <p className="text-[11px] text-slate-400">Ask questions and click inline citations.</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition shadow-xl shadow-indigo-600/30 inline-flex items-center gap-2 border border-white/10"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Knowledge Base</span>
          </button>
        </div>
      )}

      {/* Main Knowledge Base Browser */}
      {knowledgeBases.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: KB List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              Repositories ({knowledgeBases.length})
            </div>

            <div className="space-y-3">
              {knowledgeBases.map(kb => {
                const isSelected = activeKb?.id === kb.id;
                return (
                  <div
                    key={kb.id}
                    onClick={() => setSelectedKbId(kb.id)}
                    className={`p-4 rounded-3xl border transition cursor-pointer text-left relative ${
                      isSelected
                        ? 'border-indigo-500/80 bg-indigo-500/15 shadow-xl shadow-indigo-950/50 ring-1 ring-indigo-500/30'
                        : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>📚 {kb.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {kb.description || 'No description provided'}
                        </p>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm(`Delete knowledge base "${kb.name}" and its indexed chunks?`)) {
                            onDeleteKb(kb.id);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-white/[0.08] transition"
                        title="Delete KB"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{kb.documentCount} Documents</span>
                      <span>{kb.totalChunks} Chunks</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active KB Detail & Document List */}
          <div className="lg:col-span-2 space-y-4">
            {activeKb && (
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{activeKb.name}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">{activeKb.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => onOpenUpload(activeKb.id)}
                      className="px-4 py-2 rounded-2xl text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] transition flex items-center gap-1.5 border border-white/[0.1]"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload PDF</span>
                    </button>
                    <button
                      onClick={() => onStartRagChat(activeKb.id)}
                      className="px-4 py-2 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 border border-white/10"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Query this KB</span>
                    </button>
                  </div>
                </div>

                {/* Documents list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Uploaded Documents ({kbDocs.length})</span>
                    <span className="font-mono text-[11px] font-normal text-slate-500">
                      {activeKb.totalChunks} indexed chunks
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {kbDocs.map(doc => (
                      <div
                        key={doc.id}
                        className="liquid-glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shrink-0 shadow-sm">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-white truncate max-w-sm">
                              {doc.filename}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{doc.pageCount} Pages</span>
                              <span>•</span>
                              <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                              <span>•</span>
                              <span
                                className={`px-2 py-0.2 rounded-full font-semibold ${
                                  doc.status === 'READY'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : doc.status === 'FAILED'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {doc.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onOpenDocument(doc)}
                            className="px-3.5 py-1.5 rounded-2xl text-xs font-medium text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 transition flex items-center gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>View Pages</span>
                          </button>
                          <button
                            onClick={() => onDeleteDocument(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-white/[0.08] transition"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {kbDocs.length === 0 && (
                      <div className="p-10 text-center border border-dashed border-white/[0.1] rounded-3xl text-xs text-slate-500 space-y-3">
                        <UploadCloud className="w-8 h-8 mx-auto text-slate-600" />
                        <div>
                          <p className="font-semibold text-slate-400">No documents in this Knowledge Base yet.</p>
                          <p className="text-[11px] text-slate-500 mt-1">Upload your PDF or paste document text to start querying.</p>
                        </div>
                        <button
                          onClick={() => onOpenUpload(activeKb.id)}
                          className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload PDF Document</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
