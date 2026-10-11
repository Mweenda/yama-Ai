import React, { useState, useRef } from 'react';
import { KnowledgeBase, DocumentRecord } from '../types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Zap,
  FolderPlus,
} from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  knowledgeBases: KnowledgeBase[];
  selectedKbId?: string;
  onClose: () => void;
  onUploaded: (doc: DocumentRecord) => void;
  onOpenCreateKb?: () => void;
}

type StepStatus = 'pending' | 'active' | 'completed' | 'failed';

interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  knowledgeBases,
  selectedKbId,
  onClose,
  onUploaded,
  onOpenCreateKb,
}) => {
  const [kbId, setKbId] = useState<string>(
    selectedKbId || (knowledgeBases.length > 0 ? knowledgeBases[0].id : '')
  );
  const [file, setFile] = useState<File | null>(null);
  const [customText, setCustomText] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: 'upload', label: 'Uploading Document', status: 'pending' },
    { id: 'extract', label: 'Extracting Pages & Text Integrity', status: 'pending' },
    { id: 'chunk', label: 'Page-Aware Semantic Chunking (500-1000 tokens, 15% overlap)', status: 'pending' },
    { id: 'embed', label: 'Generating Dense Vector Embeddings (768-dim)', status: 'pending' },
    { id: 'index', label: 'Indexing into Knowledge Base', status: 'pending' },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetSteps = () => {
    setSteps([
      { id: 'upload', label: 'Uploading Document', status: 'pending' },
      { id: 'extract', label: 'Extracting Pages & Text Integrity', status: 'pending' },
      { id: 'chunk', label: 'Page-Aware Semantic Chunking (500-1000 tokens, 15% overlap)', status: 'pending' },
      { id: 'embed', label: 'Generating Dense Vector Embeddings (768-dim)', status: 'pending' },
      { id: 'index', label: 'Indexing into Knowledge Base', status: 'pending' },
    ]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilename(selectedFile.name);
      setErrorMsg(null);

      const reader = new FileReader();
      reader.onload = evt => {
        const text = evt.target?.result as string;
        setCustomText(text || '');
      };
      reader.readAsText(selectedFile);
    }
  };

  const executePipeline = async () => {
    if (!kbId) {
      setErrorMsg('Please select or create a Knowledge Base');
      return;
    }
    if (!filename || (!customText && !file)) {
      setErrorMsg('Please select a document file (.pdf, .txt, .md, .json)');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    resetSteps();

    const updateStep = (id: string, status: StepStatus) => {
      setSteps(prev =>
        prev.map(s => (s.id === id ? { ...s, status } : s))
      );
    };

    try {
      updateStep('upload', 'active');
      await new Promise(r => setTimeout(r, 350));
      updateStep('upload', 'completed');

      updateStep('extract', 'active');
      await new Promise(r => setTimeout(r, 400));

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          knowledgeBaseId: kbId,
          filename,
          rawContent: customText,
          size: file?.size || customText.length,
          mimeType: file?.type || 'application/pdf',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Upload failed');
      }

      if (data.warning || data.document?.isScanned) {
        updateStep('extract', 'failed');
        setErrorMsg(data.warning || 'This document appears to be scanned. OCR processing is required.');
        setIsProcessing(false);
        return;
      }

      updateStep('extract', 'completed');

      updateStep('chunk', 'active');
      await new Promise(r => setTimeout(r, 350));
      updateStep('chunk', 'completed');

      updateStep('embed', 'active');
      await new Promise(r => setTimeout(r, 500));
      updateStep('embed', 'completed');

      updateStep('index', 'active');
      await new Promise(r => setTimeout(r, 350));
      updateStep('index', 'completed');

      await new Promise(r => setTimeout(r, 200));
      onUploaded(data.document);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Pipeline failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="liquid-dialog rounded-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shadow-md shadow-indigo-500/10">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Upload Document</h2>
              <p className="text-xs text-slate-400">Semantic chunking, page retention, and vector indexing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* KB Target Selection */}
          <div className="space-y-1.5">
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
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                No Knowledge Bases created yet. Please create a Knowledge Base first.
              </div>
            ) : (
              <select
                value={kbId}
                onChange={e => setKbId(e.target.value)}
                className="w-full liquid-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
              >
                {knowledgeBases.map(kb => (
                  <option key={kb.id} value={kb.id} className="bg-slate-900 text-slate-100">
                    {kb.name} ({kb.documentCount} docs)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/[0.12] hover:border-indigo-400/50 rounded-3xl p-8 text-center cursor-pointer transition bg-white/[0.015] hover:bg-white/[0.035] group shadow-inner"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,.json"
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="p-3.5 rounded-2xl bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition border border-indigo-500/20 shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-3.5">
                {filename ? filename : 'Drag and drop your file here, or click to browse'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports PDF, Markdown, TXT • Page numbers & headings preserved
              </p>
            </div>
          </div>

          {/* Paste Document Text (Alternative) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Or Paste Text / Document Excerpt</label>
              <span className="text-[10px] text-slate-500">Auto-splits into pages & chunks</span>
            </div>
            <textarea
              rows={4}
              value={customText}
              onChange={e => {
                setCustomText(e.target.value);
                if (!filename) setFilename('Pasted_Document.txt');
              }}
              placeholder="Paste raw document text or textbook chapters here..."
              className="w-full liquid-input rounded-2xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
            />
          </div>

          {/* Pipeline Progress Stepper */}
          {isProcessing && (
            <div className="liquid-glass-card rounded-2xl p-4 space-y-2.5 font-mono text-xs">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-sans font-semibold mb-2 flex items-center justify-between">
                <span>Ingestion Pipeline</span>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              </div>

              {steps.map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {s.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {s.status === 'active' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                    {s.status === 'failed' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                    {s.status === 'pending' && <span className="w-4 h-4 rounded-full border border-slate-700" />}
                    <span
                      className={
                        s.status === 'completed'
                          ? 'text-emerald-300'
                          : s.status === 'active'
                          ? 'text-indigo-300 font-semibold'
                          : s.status === 'failed'
                          ? 'text-rose-300'
                          : 'text-slate-500'
                      }
                    >
                      {s.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {s.status === 'completed' ? '✓' : s.status === 'active' ? '...' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Processing Notice:</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3 bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing || !filename || (!customText && !file) || !kbId}
            onClick={executePipeline}
            className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-white/10"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Ingesting...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Ingest Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
