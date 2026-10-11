import React, { useState, useRef, useEffect } from 'react';
import {
  Chat,
  ChatMessage,
  KnowledgeBase,
  UserProfile,
  ChatSource,
  GroundingStatus,
} from '../types';
import {
  Send,
  BookOpen,
  Sparkles,
  Globe,
  FileText,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  RefreshCw,
  Copy,
  Check,
  Search,
} from 'lucide-react';

interface ChatViewProps {
  chat: Chat;
  messages: ChatMessage[];
  knowledgeBases: KnowledgeBase[];
  profile: UserProfile;
  onSendMessage: (text: string, model: string) => Promise<void>;
  onOpenCitation: (filename: string, pageNumber: number, snippet?: string) => void;
  onOpenSettings?: () => void;
  isStreaming: boolean;
  streamingDelta: string;
  streamingStatus: string;
  streamingSources?: ChatSource[];
  streamingGrounding?: GroundingStatus;
  usedWebFallback?: boolean;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Default)' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
];

export const ChatView: React.FC<ChatViewProps> = ({
  chat,
  messages,
  knowledgeBases,
  profile,
  onSendMessage,
  onOpenCitation,
  onOpenSettings,
  isStreaming,
  streamingDelta,
  streamingStatus,
  streamingSources = [],
  streamingGrounding,
  usedWebFallback,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeKb = chat.knowledgeBaseId
    ? knowledgeBases.find(k => k.id === chat.knowledgeBaseId)
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingDelta, streamingStatus]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text, selectedModel);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to parse inline citation pills like [Source: Filename.pdf, p. 42]
  const renderMessageContent = (content: string, sources: ChatSource[] = []) => {
    const citationRegex = /\[Source:\s*([^,\]]+),\s*p\.?\s*(\d+)\]/gi;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }

      const filename = match[1].trim();
      const pageNum = parseInt(match[2], 10);
      const matchingSource = sources.find(
        s => s.filename.toLowerCase() === filename.toLowerCase() || s.pageStart === pageNum
      );

      parts.push(
        <button
          key={`cit_${matchIndex}`}
          type="button"
          onClick={() => onOpenCitation(filename, pageNum, matchingSource?.contentSnippet)}
          className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border border-indigo-400/30 text-xs font-mono transition group cursor-pointer shadow-sm"
          title={`Click to open ${filename} at Page ${pageNum}`}
        >
          <FileText className="w-3 h-3 text-indigo-400 group-hover:scale-110 transition" />
          <span>
            {filename} : p.{pageNum}
          </span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
        </button>
      );

      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{parts}</div>;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-white/[0.08] liquid-glass flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shrink-0 shadow-md">
            {chat.mode === 'rag' ? <BookOpen className="w-4 h-4" /> : <Globe className="w-4 h-4 text-cyan-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">{chat.title}</h2>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${
                  chat.mode === 'rag'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                }`}
              >
                {chat.mode === 'rag' ? 'Knowledge Base RAG' : 'Open Interweb Search'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {chat.mode === 'rag' && activeKb ? (
                <span>
                  Active Base: <strong>📚 {activeKb.name}</strong> •{' '}
                  <span className={profile.searchScope === 'kb_only' ? 'text-indigo-300 font-medium' : 'text-cyan-300 font-medium'}>
                    {profile.searchScope === 'kb_only' ? 'Strict KB Retrieval' : 'Hybrid Web Grounding via Gemini'}
                  </span>
                </span>
              ) : (
                <span>Real-time Google Grounding • Persona: {profile.assistantRole}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Header Controls: Search Scope Switcher & Model Engine */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Active Search Scope Indicator Button */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className={`px-3 py-1.5 rounded-2xl text-[11px] font-medium border transition flex items-center gap-1.5 shadow-sm ${
                profile.searchScope === 'kb_only'
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25'
              }`}
              title="Click to adjust Search Scope (Knowledge Base Only vs Hybrid Internet) in Settings"
            >
              {profile.searchScope === 'kb_only' ? (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Scope:</span>
                  <span className="font-semibold">KB Only</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Scope:</span>
                  <span className="font-semibold">KB + Internet</span>
                </>
              )}
            </button>
          )}

          {/* Model Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 hidden md:inline">Engine:</span>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="liquid-input rounded-2xl px-2.5 sm:px-3 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20">
              {chat.mode === 'rag' ? <BookOpen className="w-8 h-8" /> : <Globe className="w-8 h-8 text-cyan-400" />}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {chat.mode === 'rag'
                  ? `Ready to query "${activeKb?.name || 'Knowledge Base'}"`
                  : `Open Interweb AI Query`}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {chat.mode === 'rag'
                  ? 'Ask questions grounded strictly in your uploaded materials. Yama AI will retrieve the most relevant semantic passages and link page citations.'
                  : 'Search across the live web and synthesize answers with Google Grounding search tools.'}
              </p>
            </div>

            {/* Quick Action Hints */}
            {chat.mode === 'rag' && activeKb && activeKb.documentCount === 0 && (
              <div className="liquid-glass-card rounded-2xl p-4 max-w-md mx-auto text-xs text-slate-400 border border-white/[0.08]">
                💡 This Knowledge Base has no uploaded documents yet. Click <strong>Upload PDF</strong> from the Knowledge Bases tab to add your files.
              </div>
            )}
          </div>
        )}

        {/* Render Conversation Messages */}
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          const isExpanded = !!expandedSources[msg.id];
          const hasSources = msg.sources && msg.sources.length > 0;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'} animate-in fade-in duration-200`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 border border-white/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`flex-1 rounded-3xl p-5 text-xs sm:text-sm transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium ml-12 shadow-xl shadow-indigo-950/50 border border-white/10'
                    : 'liquid-glass text-slate-200'
                }`}
              >
                {/* Assistant Message Header: Grounding Status & Metrics */}
                {!isUser && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      {msg.groundingStatus && (
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                            msg.groundingStatus === 'SUPPORTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : msg.groundingStatus === 'PARTIALLY_SUPPORTED'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {msg.groundingStatus}
                        </span>
                      )}

                      {msg.usedWebFallback && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-medium">
                          <Globe className="w-3 h-3" />
                          Web Grounding Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.metrics && (
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                          <span>Retrieval: {msg.metrics.retrievalLatencyMs || 0}ms</span>
                          <span>•</span>
                          <span>LLM: {msg.metrics.llmLatencyMs || 0}ms</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Body */}
                <div className="prose prose-invert max-w-none">
                  {renderMessageContent(msg.content, msg.sources)}
                </div>

                {/* Sources Accordion */}
                {!isUser && hasSources && (
                  <div className="mt-4 pt-3 border-t border-white/[0.08]">
                    <button
                      onClick={() => toggleSources(msg.id)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-between w-full py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Retrieved Sources ({msg.sources?.length})
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-white/[0.06] animate-in fade-in">
                        {msg.sources?.map((src, i) => (
                          <div
                            key={src.id || i}
                            onClick={() => onOpenCitation(src.filename, src.pageStart, src.contentSnippet)}
                            className="p-3 rounded-2xl liquid-glass-card cursor-pointer transition text-xs space-y-1 group"
                          >
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="text-white font-semibold flex items-center gap-1">
                                [{i + 1}] {src.filename} — Page {src.pageStart}
                              </span>
                              <span className="text-indigo-400 font-bold">
                                {Math.round(src.relevanceScore * 100)}% Match
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] font-sans line-clamp-2 group-hover:text-slate-300">
                              "{src.contentSnippet}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-2xl bg-white/[0.08] text-slate-300 flex items-center justify-center shrink-0 border border-white/10">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Live Streaming Delta Bubble */}
        {isStreaming && (
          <div className="flex gap-3 max-w-3xl mr-auto animate-in fade-in">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-4 h-4" />
            </div>

            <div className="flex-1 rounded-3xl p-5 text-xs sm:text-sm liquid-glass text-slate-200 space-y-3 border-indigo-500/30">
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{streamingStatus || 'Streaming response...'}</span>
              </div>

              {streamingGrounding && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      streamingGrounding === 'SUPPORTED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    Grounding: {streamingGrounding}
                  </span>
                  {usedWebFallback && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Web Search Active
                    </span>
                  )}
                </div>
              )}

              <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                {streamingDelta || 'Synthesizing knowledge context...'}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Area with Liquid Glass Styling */}
      <div className="p-4 sm:p-5 border-t border-white/[0.08] liquid-glass">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="liquid-dialog rounded-3xl p-3 focus-within:border-indigo-400/50 transition border border-white/[0.1]"
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                chat.mode === 'rag'
                  ? `Ask questions grounded in ${activeKb?.name || 'this knowledge base'}...`
                  : `Query the open interweb or explore ideas with ${profile.assistantRole}...`
              }
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none px-2 py-1 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 px-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Press <kbd className="px-1.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[10px]">Enter</kbd> to send</span>
                <span>•</span>
                <span><kbd className="px-1.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[10px]">Shift+Enter</kbd> newline</span>
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isStreaming}
                className="px-5 py-2 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 border border-white/10"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
