import React, { useState, useEffect } from 'react';
import { DocumentRecord } from '../types';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Search,
  BookOpen,
  FileText,
  Highlighter,
} from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  document: DocumentRecord | null;
  initialPage?: number;
  highlightSnippet?: string;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  document,
  initialPage = 1,
  highlightSnippet,
  onClose,
}) => {
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(initialPage);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (initialPage) {
      setCurrentPageNumber(initialPage);
    }
  }, [initialPage, document]);

  if (!isOpen || !document) return null;

  const totalPages = document.pages.length > 0 ? document.pages.length : document.pageCount || 1;
  const activePage = document.pages.find(p => p.pageNumber === currentPageNumber) || document.pages[0];

  const handlePrevPage = () => {
    const sorted = [...document.pages].sort((a, b) => a.pageNumber - b.pageNumber);
    const currIdx = sorted.findIndex(p => p.pageNumber === currentPageNumber);
    if (currIdx > 0) {
      setCurrentPageNumber(sorted[currIdx - 1].pageNumber);
    }
  };

  const handleNextPage = () => {
    const sorted = [...document.pages].sort((a, b) => a.pageNumber - b.pageNumber);
    const currIdx = sorted.findIndex(p => p.pageNumber === currentPageNumber);
    if (currIdx < sorted.length - 1 && currIdx !== -1) {
      setCurrentPageNumber(sorted[currIdx + 1].pageNumber);
    }
  };

  const renderPageText = (text: string) => {
    if (!text) return <p className="text-slate-500 italic">No extractable text on this page.</p>;

    if (searchQuery.trim().length > 1) {
      const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      return (
        <div className="whitespace-pre-wrap leading-relaxed">
          {parts.map((part, i) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark key={i} className="bg-amber-400 text-slate-950 font-semibold px-1 rounded-md">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </div>
      );
    }

    if (highlightSnippet && highlightSnippet.trim().length > 10) {
      const cleanSnippet = highlightSnippet.replace(/\.\.\.$/, '').trim().slice(0, 80);
      const idx = text.toLowerCase().indexOf(cleanSnippet.toLowerCase().slice(0, 40));
      if (idx !== -1) {
        const matchEnd = Math.min(idx + cleanSnippet.length + 30, text.length);
        const before = text.slice(0, idx);
        const matched = text.slice(idx, matchEnd);
        const after = text.slice(matchEnd);
        return (
          <div className="whitespace-pre-wrap leading-relaxed">
            {before}
            <mark className="bg-indigo-500/30 text-indigo-100 border border-indigo-400/40 px-1 py-0.5 rounded-lg shadow-sm">
              {matched}
            </mark>
            {after}
          </div>
        );
      }
    }

    return <div className="whitespace-pre-wrap leading-relaxed text-slate-200">{text}</div>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200">
      <div className="liquid-dialog rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02] gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shrink-0 shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-md">{document.filename}</h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.06] text-indigo-300 border border-white/[0.08] font-mono">
                  #page={currentPageNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {document.pageCount || document.pages.length} Pages • {(document.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {/* Search within document */}
          <div className="relative hidden sm:block w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Find in page text..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full liquid-input rounded-2xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 liquid-glass-card rounded-2xl px-2 py-1 text-xs text-slate-400">
              <button
                onClick={() => setZoomLevel(z => Math.max(z - 10, 70))}
                className="hover:text-white p-1"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(z => Math.min(z + 10, 150))}
                className="hover:text-white p-1"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Thumbnails Sidebar */}
          <div className="w-48 border-r border-white/[0.08] bg-black/30 overflow-y-auto p-3 hidden sm:flex flex-col gap-2.5">
            <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider px-1">
              Pages ({document.pages.length})
            </div>
            {document.pages.map(page => {
              const isSelected = page.pageNumber === currentPageNumber;
              return (
                <button
                  key={page.pageNumber}
                  type="button"
                  onClick={() => setCurrentPageNumber(page.pageNumber)}
                  className={`text-left p-2.5 rounded-2xl border text-xs transition relative group ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-md'
                      : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12] hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[11px]">Page {page.pageNumber}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 font-mono group-hover:text-slate-300">
                    {page.text.slice(0, 90).replace(/\s+/g, ' ')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reading Canvas */}
          <div className="flex-1 bg-black/40 overflow-y-auto p-4 sm:p-8 flex justify-center">
            <div
              className="w-full max-w-3xl liquid-glass rounded-3xl p-6 sm:p-10 self-start transition-all border border-white/[0.1]"
              style={{ fontSize: `${(zoomLevel / 100) * 14}px` }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Document Page {activePage?.pageNumber || currentPageNumber}</span>
                </div>
                {highlightSnippet && (
                  <div className="flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Highlighter className="w-3 h-3" />
                    <span>Passage Grounding Active</span>
                  </div>
                )}
              </div>

              <div className="prose prose-invert max-w-none text-slate-200 font-serif sm:font-sans leading-relaxed selection:bg-indigo-500/40">
                {activePage ? renderPageText(activePage.text) : (
                  <p className="text-slate-500 italic">Page content not extracted or empty.</p>
                )}
              </div>

              <div className="mt-10 pt-4 border-t border-white/[0.08] text-center text-[11px] text-slate-500">
                — {document.filename} • Page {activePage?.pageNumber || currentPageNumber} of {totalPages} —
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="text-xs text-slate-400">
            Showing Page <span className="font-semibold text-white">{currentPageNumber}</span> of{' '}
            <span className="font-semibold text-white">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              className="px-3.5 py-1.5 rounded-2xl liquid-glass-card hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous Page
            </button>
            <button
              onClick={handleNextPage}
              className="px-3.5 py-1.5 rounded-2xl liquid-glass-card hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition flex items-center gap-1"
            >
              Next Page
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
