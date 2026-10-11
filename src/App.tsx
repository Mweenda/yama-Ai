import React, { useState, useEffect } from 'react';
import {
  User,
  UserProfile,
  KnowledgeBase,
  DocumentRecord,
  Chat,
  ChatMessage,
  ChatSource,
  GroundingStatus,
} from './types';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { KnowledgeBaseManager } from './components/KnowledgeBaseManager';
import { ObservabilityDashboard } from './components/ObservabilityDashboard';
import { OnboardingModal } from './components/OnboardingModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { UploadDocumentModal } from './components/UploadDocumentModal';
import { NewChatModal } from './components/NewChatModal';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import {
  FolderPlus,
  Globe,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  // Authentication State: users are greeted with the landing page by default
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('yama_authenticated') === 'true';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Navigation
  const [currentView, setCurrentView] = useState<'chat' | 'knowledge' | 'observability'>('chat');

  // Core Data
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingDelta, setStreamingDelta] = useState('');
  const [streamingStatus, setStreamingStatus] = useState('');
  const [streamingSources, setStreamingSources] = useState<ChatSource[]>([]);
  const [streamingGrounding, setStreamingGrounding] = useState<GroundingStatus | undefined>(undefined);
  const [usedWebFallback, setUsedWebFallback] = useState<boolean>(false);

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadKbId, setUploadKbId] = useState<string>('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Document Viewer
  const [viewerDoc, setViewerDoc] = useState<DocumentRecord | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  const [viewerSnippet, setViewerSnippet] = useState<string | undefined>(undefined);

  // Helper to fetch with authenticated user headers
  const authFetch = (url: string, options: RequestInit = {}) => {
    const userId = localStorage.getItem('yama_user_id') || '';
    const headers = {
      ...(options.headers || {}),
      ...(userId ? { 'x-user-id': userId } : {}),
    };
    return fetch(url, { ...options, headers });
  };

  // Fetch all user workspace data
  const fetchAllData = async () => {
    try {
      const [pRes, kbRes, dRes, cRes] = await Promise.all([
        authFetch('/api/auth/me').then(r => r.json()),
        authFetch('/api/knowledge-bases').then(r => r.json()),
        authFetch('/api/documents').then(r => r.json()),
        authFetch('/api/chats').then(r => r.json()),
      ]);

      setCurrentUser(pRes.user || null);
      setProfile(pRes.profile || null);
      setKnowledgeBases(kbRes.knowledgeBases || []);
      setDocuments(dRes.documents || []);
      setChats(cRes.chats || []);

      if (cRes.chats && cRes.chats.length > 0 && !activeChatId) {
        setActiveChatId(cRes.chats[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Fetch messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId || !isAuthenticated) {
      setActiveMessages([]);
      return;
    }
    authFetch(`/api/chats/${activeChatId}`)
      .then(r => r.json())
      .then(data => {
        if (data.messages) {
          setActiveMessages(data.messages);
        }
      })
      .catch(err => console.error(err));
  }, [activeChatId, isAuthenticated]);

  // Auth Success Callback
  const handleAuthSuccess = async (user: User, userProfile: UserProfile) => {
    setCurrentUser(user);
    setProfile(userProfile);
    setIsAuthenticated(true);
    localStorage.setItem('yama_authenticated', 'true');
    localStorage.setItem('yama_user_id', user.id);
    await fetchAllData();
  };

  // Logout Callback (Returns user to Landing Page)
  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    setIsAuthenticated(false);
    localStorage.removeItem('yama_authenticated');
    localStorage.removeItem('yama_user_id');
    setCurrentView('chat');
  };

  // Update Preferences Profile
  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    const res = await authFetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.profile) {
      setProfile(data.profile);
    }
  };

  // Update User Personal Profile Data
  const handleSaveUser = async (updates: Partial<User>) => {
    const res = await authFetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.user) {
      setCurrentUser(data.user);
    }
  };

  // Create Chat
  const handleCreateChat = async (title: string, mode: 'general' | 'rag', knowledgeBaseId?: string) => {
    const res = await authFetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, mode, knowledgeBaseId }),
    });
    const data = await res.json();
    if (data.chat) {
      setChats(prev => [data.chat, ...prev]);
      setActiveChatId(data.chat.id);
      setActiveMessages([]);
      setCurrentView('chat');
    }
  };

  // Delete Chat
  const handleDeleteChat = async (chatId: string) => {
    await authFetch(`/api/chats/${chatId}`, { method: 'DELETE' });
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
      const remaining = chats.filter(c => c.id !== chatId);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Send Message with SSE streaming
  const handleSendMessage = async (text: string, model: string) => {
    if (!activeChatId) return;

    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      chatId: activeChatId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setActiveMessages(prev => [...prev, tempUserMsg]);

    setIsStreaming(true);
    setStreamingDelta('');
    setStreamingStatus('Initiating context retrieval...');
    setStreamingSources([]);
    setStreamingGrounding(undefined);
    setUsedWebFallback(false);

    try {
      const response = await authFetch(`/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, model }),
      });

      if (!response.ok) {
        throw new Error('Failed to start message stream');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const lines = part.split('\n');
            let event = 'message';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                event = line.replace('event:', '').trim();
              } else if (line.startsWith('data:')) {
                dataStr = line.replace('data:', '').trim();
              }
            }

            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              if (event === 'status') {
                setStreamingStatus(data.message);
              } else if (event === 'retrieval') {
                setStreamingGrounding(data.groundingStatus);
                setStreamingSources(data.sources || []);
                setUsedWebFallback(!!data.usedWebFallback);
              } else if (event === 'delta') {
                accumulatedText += data.text;
                setStreamingDelta(accumulatedText);
              } else if (event === 'done') {
                setActiveMessages(prev => [...prev, data.message]);
              } else if (event === 'error') {
                const errMsg = data.error || 'Request could not be completed';
                const isQuota = errMsg.toLowerCase().includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource_exhausted');
                const content = isQuota
                  ? `> ⚠️ **Gemini API Quota Notice (429 Rate Limit)**: Your request quota for Gemini models is temporarily exhausted. To increase limits, you can attach an API key in the **Settings > Secrets** panel.`
                  : `⚠️ ${errMsg}`;
                setActiveMessages(prev => [
                  ...prev,
                  {
                    id: `err_${Date.now()}`,
                    chatId: activeChatId,
                    role: 'assistant',
                    content,
                    createdAt: new Date().toISOString(),
                  },
                ]);
              }
            } catch (_) {}
          }
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const isQuota = (err?.message || '').toLowerCase().includes('429');
      setActiveMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          chatId: activeChatId,
          role: 'assistant',
          content: isQuota
            ? `> ⚠️ **Gemini API Quota Notice (429 Rate Limit)**: Gemini API rate limit reached. To increase limits, you can configure an API key in **Settings > Secrets**.`
            : `⚠️ Connection error: ${err.message || 'Network stream error'}.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingDelta('');
      setStreamingStatus('');
    }
  };

  // Open Citation into Document Viewer
  const handleOpenCitation = (filename: string, pageNumber: number, snippet?: string) => {
    const matchedDoc = documents.find(
      d => d.filename.toLowerCase() === filename.toLowerCase() ||
           d.filename.toLowerCase().includes(filename.toLowerCase().replace('.pdf', ''))
    );

    if (matchedDoc) {
      setViewerDoc(matchedDoc);
      setViewerPage(pageNumber);
      setViewerSnippet(snippet);
    } else {
      setViewerDoc({
        id: 'virtual_doc',
        userId: currentUser?.id || 'admin_christopher',
        knowledgeBaseId: '',
        filename,
        storagePath: '',
        mimeType: 'application/pdf',
        size: 2400000,
        status: 'READY',
        pageCount: Math.max(pageNumber, 10),
        pages: [
          {
            pageNumber,
            text: snippet || `Extracted passage from ${filename} on page ${pageNumber}.`,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setViewerPage(pageNumber);
      setViewerSnippet(snippet);
    }
  };

  // Create Knowledge Base
  const handleCreateKb = async (name: string, description: string) => {
    const res = await authFetch('/api/knowledge-bases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (data.knowledgeBase) {
      setKnowledgeBases(prev => [data.knowledgeBase, ...prev]);
      setCurrentView('knowledge');
    }
  };

  // Delete Knowledge Base
  const handleDeleteKb = async (id: string) => {
    await authFetch(`/api/knowledge-bases/${id}`, { method: 'DELETE' });
    setKnowledgeBases(prev => prev.filter(k => k.id !== id));
    setDocuments(prev => prev.filter(d => d.knowledgeBaseId !== id));
  };

  // Delete Document
  const handleDeleteDocument = async (id: string) => {
    await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Uploaded Document Handler
  const handleDocumentUploaded = (doc: DocumentRecord) => {
    setDocuments(prev => [doc, ...prev]);
    authFetch('/api/knowledge-bases')
      .then(r => r.json())
      .then(d => setKnowledgeBases(d.knowledgeBases || []));
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // 1. If not authenticated, greet user with the clean Landing Page
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage onOpenLogin={() => setIsAuthModalOpen(true)} />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // 2. Authenticated Workspace
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar with drop-upward user menu */}
      {currentUser && profile && (
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={id => {
            setActiveChatId(id);
            setCurrentView('chat');
          }}
          onNewChat={() => setIsNewChatOpen(true)}
          onNewKb={() => setCurrentView('knowledge')}
          onDeleteChat={handleDeleteChat}
          currentUser={currentUser}
          profile={profile}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
          knowledgeBases={knowledgeBases}
        />
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* VIEW 1: Active Chat */}
        {currentView === 'chat' && activeChat && profile && (
          <ChatView
            chat={activeChat}
            messages={activeMessages}
            knowledgeBases={knowledgeBases}
            profile={profile}
            onSendMessage={handleSendMessage}
            onOpenCitation={handleOpenCitation}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isStreaming={isStreaming}
            streamingDelta={streamingDelta}
            streamingStatus={streamingStatus}
            streamingSources={streamingSources}
            streamingGrounding={streamingGrounding}
            usedWebFallback={usedWebFallback}
          />
        )}

        {/* VIEW 1 (Empty State): No Active Chat */}
        {currentView === 'chat' && !activeChat && (
          <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <div className="liquid-glass rounded-3xl p-8 sm:p-12 max-w-xl w-full text-center space-y-6 shadow-2xl border border-white/[0.08]">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25 text-white border border-white/20">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Welcome to Yama AI Studio
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  Your context-aware research platform. Build your private knowledge base from uploaded PDFs, or initiate an open inquiry across the live interweb.
                </p>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentView('knowledge')}
                  className="liquid-glass-card rounded-2xl p-4 text-left group transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition">
                      <FolderPlus className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                      Create Knowledge Base
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Ingest your PDFs, textbooks, or notes with page tracking.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCreateChat('Open Interweb Search', 'general');
                  }}
                  className="liquid-glass-card rounded-2xl p-4 text-left group transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition">
                      <Globe className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                      Query Open Interweb
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Live Google Search grounding across the global web.
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="px-6 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition shadow-lg shadow-indigo-600/30 border border-white/10"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Knowledge Bases Management */}
        {currentView === 'knowledge' && (
          <KnowledgeBaseManager
            knowledgeBases={knowledgeBases}
            documents={documents}
            onCreateKb={handleCreateKb}
            onDeleteKb={handleDeleteKb}
            onDeleteDocument={handleDeleteDocument}
            onOpenUpload={kbId => {
              setUploadKbId(kbId);
              setIsUploadOpen(true);
            }}
            onOpenDocument={doc => {
              setViewerDoc(doc);
              setViewerPage(1);
              setViewerSnippet(undefined);
            }}
            onStartRagChat={kbId => {
              const kb = knowledgeBases.find(k => k.id === kbId);
              handleCreateChat(
                kb ? `Query: ${kb.name}` : 'Knowledge Base Chat',
                'rag',
                kbId
              );
            }}
          />
        )}

        {/* VIEW 3: Observability & Analytics */}
        {currentView === 'observability' && (
          <ObservabilityDashboard onRefreshData={fetchAllData} />
        )}
      </main>

      {/* User Personal Profile Modal (Personal Data) */}
      {currentUser && (
        <ProfileModal
          isOpen={isProfileOpen}
          currentUser={currentUser}
          onSave={handleSaveUser}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {/* User Preferences & Search Scope Modal (Preferences) */}
      {currentUser && profile && (
        <SettingsModal
          isOpen={isSettingsOpen}
          currentUser={currentUser}
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Onboarding & Persona Setup Modal */}
      {profile && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          initialProfile={profile}
          onSave={handleSaveProfile}
          onClose={() => setIsOnboardingOpen(false)}
        />
      )}

      {/* Interactive Document / PDF Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!viewerDoc}
        document={viewerDoc}
        initialPage={viewerPage}
        highlightSnippet={viewerSnippet}
        onClose={() => setViewerDoc(null)}
      />

      {/* Ingestion & PDF Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadOpen}
        knowledgeBases={knowledgeBases}
        selectedKbId={uploadKbId}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={handleDocumentUploaded}
        onOpenCreateKb={() => {
          setIsUploadOpen(false);
          setCurrentView('knowledge');
        }}
      />

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        knowledgeBases={knowledgeBases}
        onClose={() => setIsNewChatOpen(false)}
        onCreateChat={handleCreateChat}
        onOpenCreateKb={() => {
          setIsNewChatOpen(false);
          setCurrentView('knowledge');
        }}
      />
    </div>
  );
}
