import React from 'react';
import {
  Sparkles,
  BookOpen,
  Globe,
  FileText,
  ArrowRight,
  UploadCloud,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
}) => {
  return (
    <div className="w-full min-h-[100dvh] bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden relative flex flex-col justify-between">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[350px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-72 right-4 w-72 h-72 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-4 w-72 h-72 bg-purple-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Main Responsive Body Container */}
      <div className="flex-1 flex flex-col justify-between w-full">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-72 right-4 w-72 h-72 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-10 left-4 w-72 h-72 bg-purple-600/10 blur-3xl pointer-events-none rounded-full" />

        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-white/[0.08] liquid-glass">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 font-bold text-sm tracking-tight border border-white/20 shrink-0">
                YA
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Yama AI
                </span>
                <p className="text-[10px] text-slate-400">Context-Aware Research</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onOpenLogin}
                className="px-3 sm:px-4 py-2 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Sign In
              </button>
              <button
                onClick={onOpenLogin}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition shadow-lg shadow-indigo-600/30 border border-white/15 flex items-center gap-1.5 sm:gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 md:pt-16 pb-8 text-center space-y-4 sm:space-y-6 flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-indigo-500/30 shadow-lg text-[11px] sm:text-xs font-medium text-indigo-300 mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Private Knowledge Bases & Gemini Models</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Chat with your files.{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Verify every answer.
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Upload your PDFs, textbooks, and research notes. Ask questions in simple language and receive verified responses with clickable page citations.
          </p>

          {/* Action CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition shadow-xl shadow-indigo-600/35 border border-white/20 flex items-center justify-center gap-2"
            >
              <span>Start Using Yama AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 4 Feature Steps - Responsive for PC (4 cols), Tablet (2 cols), Mobile (1 col) */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
          <div className="text-center space-y-1 mb-6">
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
              What You Can Do on Yama AI
            </h2>
            <p className="text-xs text-slate-400">
              Turn your documents into an interactive, cited knowledge assistant.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Step 1 */}
            <div className="liquid-glass-card rounded-3xl p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center">
                <UploadCloud className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">1. Create Knowledge Bases</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload your files. The system indexes your documents page by page.
              </p>
            </div>

            {/* Step 2 */}
            <div className="liquid-glass-card rounded-3xl p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-2xl bg-violet-500/15 border border-violet-500/25 text-violet-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">2. Ask Questions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask anything in normal words. Answers are grounded directly in your files.
              </p>
            </div>

            {/* Step 3 */}
            <div className="liquid-glass-card rounded-3xl p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">3. Click Page Citations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every answer links to the original page. Click any citation to view the highlighted text.
              </p>
            </div>

            {/* Step 4 */}
            <div className="liquid-glass-card rounded-3xl p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">4. Control Search Scope</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose in settings whether to query your documents only, or include the open internet via Gemini.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.08] liquid-glass py-4 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <div>
              © 2026 Yama AI. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <span>Private Documents</span>
              <span>•</span>
              <span>Verifiable Citations</span>
              <span>•</span>
              <span>Gemini Grounding</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
