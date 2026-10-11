import React, { useState, useRef, useEffect } from 'react';
import { Chat, KnowledgeBase, User, UserProfile } from '../types';
import {
  MessageSquare,
  Plus,
  BookOpen,
  Folder,
  FolderPlus,
  Activity,
  Settings,
  Sparkles,
  Trash2,
  Globe,
  Compass,
  LogOut,
  ChevronUp,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
} from 'lucide-react';

interface SidebarProps {
  currentView: 'chat' | 'knowledge' | 'observability';
  onSelectView: (view: 'chat' | 'knowledge' | 'observability') => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onNewKb: () => void;
  onDeleteChat: (chatId: string) => void;
  currentUser: User;
  profile: UserProfile;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  knowledgeBases: KnowledgeBase[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onNewKb,
  onDeleteChat,
  currentUser,
  profile,
  onOpenProfile,
  onOpenSettings,
  onLogout,
  knowledgeBases,
}) => {
  const [isDropUpOpen, setIsDropUpOpen] = useState(false);
  const dropUpRef = useRef<HTMLDivElement>(null);

  // Close drop-up when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropUpRef.current && !dropUpRef.current.contains(event.target as Node)) {
        setIsDropUpOpen(false);
      }
    }
    if (isDropUpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropUpOpen]);

  return (
    <aside className="w-72 liquid-glass border-r border-white/[0.08] flex flex-col h-full shrink-0 select-none z-20 relative">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 font-bold text-sm tracking-tight border border-white/20">
            YA
          </div>
          <div>
            <div className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
              <span>Yama AI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-medium border border-indigo-500/30">
                Studio
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Context-Aware RAG Platform</p>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="p-3.5 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-[0.98] border border-white/15"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        <button
          onClick={onNewKb}
          className="w-full py-2 px-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white font-medium text-xs transition flex items-center justify-center gap-2 border border-white/[0.08]"
        >
          <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
          <span>Create Knowledge Base</span>
        </button>
      </div>

      {/* Platform Navigation */}
      <div className="px-3 py-1 space-y-1">
        <button
          onClick={() => onSelectView('knowledge')}
          className={`w-full px-3 py-2 rounded-2xl text-xs font-medium transition flex items-center justify-between ${
            currentView === 'knowledge'
              ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/30 shadow-md shadow-indigo-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Folder className="w-4 h-4 text-indigo-400" />
            <span>Knowledge Bases</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.06]">
            {knowledgeBases.length}
          </span>
        </button>

        <button
          onClick={() => onSelectView('observability')}
          className={`w-full px-3 py-2 rounded-2xl text-xs font-medium transition flex items-center justify-between ${
            currentView === 'observability'
              ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/30 shadow-md shadow-indigo-950/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-violet-400" />
            <span>Telemetry & Analytics</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>
      </div>

      {/* Recent Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Conversations</span>
          <span className="text-[10px] font-mono text-slate-500">{chats.length}</span>
        </div>

        {chats.map(c => {
          const isSelected = currentView === 'chat' && activeChatId === c.id;
          return (
            <div
              key={c.id}
              onClick={() => {
                onSelectView('chat');
                onSelectChat(c.id);
              }}
              className={`group px-3 py-2.5 rounded-2xl text-xs transition cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-white/[0.08] text-white font-semibold border border-white/[0.15] shadow-lg shadow-black/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {c.mode === 'rag' ? (
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                <span className="truncate">{c.title}</span>
              </div>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteChat(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded-lg transition"
                title="Delete Chat"
              >
                <Trash2 className="w-3 3-4" />
              </button>
            </div>
          );
        })}

        {chats.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-slate-500 space-y-2">
            <Compass className="w-5 h-5 mx-auto text-slate-600" />
            <p>No chats yet.</p>
            <p className="text-[11px] text-slate-600">Start a new chat to query your documents or search the web.</p>
          </div>
        )}
      </div>

      {/* User ID Field & Drop-Upward Window in Bottom of Left Column */}
      <div className="p-3 border-t border-white/[0.06] bg-slate-950/40 relative" ref={dropUpRef}>
        {/* Drop-Upward Floating Window */}
        {isDropUpOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 liquid-dialog rounded-3xl p-4 shadow-2xl border border-white/[0.12] space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
            {/* Header info in Drop-Upward */}
            <div className="pb-3 border-b border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  {currentUser.isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200 font-mono font-medium border border-indigo-500/40">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                {currentUser.email}
              </p>
              <div className="text-[10px] text-indigo-300 mt-1">
                Persona: {profile.assistantRole} ({profile.role})
              </div>
              <div className="text-[10px] mt-1 flex items-center gap-1.5 text-cyan-300">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span>Scope: {profile.searchScope === 'kb_only' ? 'KB Only (Private)' : 'KB + Internet'}</span>
              </div>
            </div>

            {/* Menu Actions */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setIsDropUpOpen(false);
                  onOpenProfile();
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2.5 text-left"
              >
                <UserIcon className="w-4 h-4 text-cyan-400" />
                <span>Personal Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDropUpOpen(false);
                  onOpenSettings();
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2.5 text-left"
              >
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Settings & Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDropUpOpen(false);
                  onSelectView('observability');
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.08] transition flex items-center gap-2.5 text-left"
              >
                <Activity className="w-4 h-4 text-violet-400" />
                <span>Metrics & Events</span>
              </button>

              <div className="pt-1 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropUpOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 transition flex items-center gap-2.5 text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Log Out of Studio</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User's ID Button Trigger */}
        <button
          type="button"
          onClick={() => setIsDropUpOpen(!isDropUpOpen)}
          className={`w-full p-2.5 rounded-2xl transition cursor-pointer flex items-center justify-between group border ${
            isDropUpOpen
              ? 'bg-white/[0.08] border-indigo-500/40 shadow-lg shadow-indigo-950/40'
              : 'hover:bg-white/[0.05] border-transparent hover:border-white/[0.08]'
          }`}
          title="Click to open Profile & Settings"
        >
          <div className="flex items-center gap-2.5 min-w-0 text-left">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                {currentUser.isAdmin && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/25 text-indigo-300 font-mono">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {currentUser.email}
              </div>
            </div>
          </div>

          <ChevronUp
            className={`w-4 h-4 text-slate-500 group-hover:text-slate-300 transition shrink-0 ${
              isDropUpOpen ? 'rotate-180 text-indigo-400' : ''
            }`}
          />
        </button>
      </div>
    </aside>
  );
};
