import fs from 'fs';
import path from 'path';
import {
  User,
  UserProfile,
  KnowledgeBase,
  DocumentRecord,
  DocumentChunk,
  Chat,
  ChatMessage,
  UsageEvent,
} from '../types';
import { createInitialSeed, DatabaseState } from './seed';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export class DatabaseStore {
  private state: DatabaseState;
  private currentUserId: string = 'admin_christopher';
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.state = this.loadFromDisk();
  }

  /**
   * Load state from local disk database.json, or initialize from clean seed.
   */
  private loadFromDisk(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          // Normalize state schema
          return {
            users: parsed.users || [],
            profiles: parsed.profiles || {},
            knowledgeBases: parsed.knowledgeBases || [],
            documents: parsed.documents || [],
            chunks: parsed.chunks || [],
            chats: parsed.chats || [],
            messages: parsed.messages || {},
            usageEvents: parsed.usageEvents || [],
          };
        }
      }
    } catch (err) {
      console.warn('Could not read existing database.json, initializing default state:', err);
    }

    const initial = createInitialSeed();
    this.persistToDiskSync(initial);
    return initial;
  }

  /**
   * Synchronous disk persistence (used on init and critical mutations)
   */
  private persistToDiskSync(stateToSave: DatabaseState = this.state): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(stateToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to synchronously write database.json:', err);
    }
  }

  /**
   * High performance debounced / immediate disk save
   */
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    // High-performance asynchronous flush to disk (100ms debounce)
    this.saveTimeout = setTimeout(() => {
      this.persistToDiskSync();
      this.saveTimeout = null;
    }, 100);
  }

  // --- Authentication & User Isolation ---
  validateUser(email: string, password: string): User | null {
    const cleanEmail = email.toLowerCase().trim();
    const user = this.state.users.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === password
    );
    if (user) {
      this.currentUserId = user.id;
      return user;
    }
    return null;
  }

  registerUser(name: string, email: string, password: string): User {
    const cleanEmail = email.toLowerCase().trim();
    const existing = this.state.users.find(
      u => u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      password,
      isAdmin: false,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    };

    this.state.users.push(newUser);
    this.currentUserId = newUser.id;

    // Create default isolated profile
    this.state.profiles[newUser.id] = {
      userId: newUser.id,
      role: 'General User',
      fields: ['General Research'],
      experience: 'Intermediate',
      useCases: ['Document Synthesis', 'Literature Review'],
      assistantRole: 'Research Assistant',
      customInstructions: 'Provide clear, verifiable answers with clickable page citations.',
      searchScope: 'hybrid',
      completedOnboarding: true,
      updatedAt: new Date().toISOString(),
    };

    this.scheduleSave();
    return newUser;
  }

  getUserById(userId: string): User | undefined {
    return this.state.users.find(u => u.id === userId);
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  setCurrentUserId(userId: string): void {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      this.currentUserId = userId;
    }
  }

  getUsers(): User[] {
    return [...this.state.users];
  }

  getCurrentUser(): User {
    return (
      this.state.users.find(u => u.id === this.currentUserId) ||
      this.state.users[0]
    );
  }

  updateUser(userId: string, updates: Partial<User>): User {
    const idx = this.state.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      // Security: never overwrite primary key or admin privileges through basic update
      const { id, isAdmin, ...safeUpdates } = updates as any;
      this.state.users[idx] = {
        ...this.state.users[idx],
        ...safeUpdates,
      };
      this.scheduleSave();
      return { ...this.state.users[idx] };
    }
    throw new Error('User not found');
  }

  getProfile(userId: string): UserProfile {
    if (!this.state.profiles[userId]) {
      this.state.profiles[userId] = {
        userId,
        role: 'General User',
        fields: ['General Research'],
        experience: 'Intermediate',
        useCases: ['Document Synthesis'],
        assistantRole: 'Research Assistant',
        customInstructions: '',
        searchScope: 'hybrid',
        completedOnboarding: true,
        updatedAt: new Date().toISOString(),
      };
      this.scheduleSave();
    }
    return { ...this.state.profiles[userId] };
  }

  updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const existing = this.getProfile(userId);
    const updated = {
      ...existing,
      ...updates,
      userId, // Immutable tenant boundary
      updatedAt: new Date().toISOString(),
    };
    this.state.profiles[userId] = updated;
    this.scheduleSave();
    return updated;
  }

  // --- Knowledge Bases (Strictly Multi-Tenant) ---
  getKnowledgeBases(userId: string): KnowledgeBase[] {
    return this.state.knowledgeBases.filter(kb => kb.userId === userId);
  }

  getKnowledgeBase(userId: string, kbId: string): KnowledgeBase | undefined {
    return this.state.knowledgeBases.find(
      kb => kb.id === kbId && kb.userId === userId
    );
  }

  createKnowledgeBase(
    userId: string,
    data: { name: string; description: string; icon?: string; color?: string }
  ): KnowledgeBase {
    const newKb: KnowledgeBase = {
      id: `kb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name: data.name,
      description: data.description,
      icon: data.icon || 'folder',
      color: data.color || 'blue',
      documentCount: 0,
      totalChunks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.knowledgeBases.unshift(newKb);
    this.scheduleSave();
    return newKb;
  }

  deleteKnowledgeBase(userId: string, kbId: string): boolean {
    const idx = this.state.knowledgeBases.findIndex(
      kb => kb.id === kbId && kb.userId === userId
    );
    if (idx === -1) return false;

    this.state.knowledgeBases.splice(idx, 1);
    // Cascade delete documents & chunks belonging to this user & kb
    this.state.documents = this.state.documents.filter(
      d => !(d.knowledgeBaseId === kbId && d.userId === userId)
    );
    this.state.chunks = this.state.chunks.filter(
      c => !(c.knowledgeBaseId === kbId && c.userId === userId)
    );
    this.scheduleSave();
    return true;
  }

  // --- Documents (Strictly Multi-Tenant) ---
  getDocuments(userId: string, knowledgeBaseId?: string): DocumentRecord[] {
    return this.state.documents.filter(d => {
      if (d.userId !== userId) return false;
      if (knowledgeBaseId && d.knowledgeBaseId !== knowledgeBaseId) return false;
      return true;
    });
  }

  getDocument(userId: string, docId: string): DocumentRecord | undefined {
    return this.state.documents.find(d => d.id === docId && d.userId === userId);
  }

  addDocument(doc: DocumentRecord): void {
    this.state.documents.unshift(doc);
    // Update KB document count
    const kb = this.state.knowledgeBases.find(
      k => k.id === doc.knowledgeBaseId && k.userId === doc.userId
    );
    if (kb) {
      kb.documentCount = this.state.documents.filter(
        d => d.knowledgeBaseId === kb.id && d.userId === doc.userId
      ).length;
    }
    this.scheduleSave();
  }

  updateDocument(
    userId: string,
    docId: string,
    updates: Partial<DocumentRecord>
  ): DocumentRecord | undefined {
    const doc = this.state.documents.find(
      d => d.id === docId && d.userId === userId
    );
    if (!doc) return undefined;
    Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
    this.scheduleSave();
    return doc;
  }

  deleteDocument(userId: string, docId: string): boolean {
    const idx = this.state.documents.findIndex(
      d => d.id === docId && d.userId === userId
    );
    if (idx === -1) return false;

    const [deletedDoc] = this.state.documents.splice(idx, 1);
    this.state.chunks = this.state.chunks.filter(
      c => c.documentId !== docId && c.userId === userId
    );

    // Update KB counts
    const kb = this.state.knowledgeBases.find(
      k => k.id === deletedDoc.knowledgeBaseId && k.userId === userId
    );
    if (kb) {
      kb.documentCount = this.state.documents.filter(
        d => d.knowledgeBaseId === kb.id && d.userId === userId
      ).length;
      kb.totalChunks = this.state.chunks.filter(
        c => c.knowledgeBaseId === kb.id && c.userId === userId
      ).length;
    }
    this.scheduleSave();
    return true;
  }

  // --- Chunks (User-Isolated) ---
  getAllChunks(): DocumentChunk[] {
    return this.state.chunks;
  }

  getChunks(userId: string, knowledgeBaseId: string): DocumentChunk[] {
    return this.state.chunks.filter(
      c => c.userId === userId && c.knowledgeBaseId === knowledgeBaseId
    );
  }

  addChunks(newChunks: DocumentChunk[]): void {
    this.state.chunks.push(...newChunks);
    if (newChunks.length > 0) {
      const kbId = newChunks[0].knowledgeBaseId;
      const uId = newChunks[0].userId;
      const kb = this.state.knowledgeBases.find(
        k => k.id === kbId && k.userId === uId
      );
      if (kb) {
        kb.totalChunks = this.state.chunks.filter(
          c => c.knowledgeBaseId === kbId && c.userId === uId
        ).length;
      }
    }
    this.scheduleSave();
  }

  // --- Chats (Strictly Multi-Tenant) ---
  getChats(userId: string): Chat[] {
    return this.state.chats
      .filter(c => c.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  getChat(userId: string, chatId: string): Chat | undefined {
    return this.state.chats.find(c => c.id === chatId && c.userId === userId);
  }

  createChat(
    userId: string,
    data: { title: string; mode: 'general' | 'rag'; knowledgeBaseId?: string }
  ): Chat {
    const newChat: Chat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title: data.title,
      mode: data.mode,
      knowledgeBaseId: data.knowledgeBaseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.chats.unshift(newChat);
    this.state.messages[newChat.id] = [];
    this.scheduleSave();
    return newChat;
  }

  deleteChat(userId: string, chatId: string): boolean {
    const idx = this.state.chats.findIndex(
      c => c.id === chatId && c.userId === userId
    );
    if (idx === -1) return false;
    this.state.chats.splice(idx, 1);
    delete this.state.messages[chatId];
    this.scheduleSave();
    return true;
  }

  // --- Messages ---
  getMessages(userId: string, chatId: string): ChatMessage[] {
    const chat = this.getChat(userId, chatId);
    if (!chat) return [];
    return this.state.messages[chatId] || [];
  }

  addMessage(
    userId: string,
    chatId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'>
  ): ChatMessage {
    const chat = this.getChat(userId, chatId);
    if (!chat) {
      throw new Error(`Unauthorized or chat not found: ${chatId}`);
    }

    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    if (!this.state.messages[chatId]) {
      this.state.messages[chatId] = [];
    }
    this.state.messages[chatId].push(newMessage);

    chat.updatedAt = new Date().toISOString();
    this.scheduleSave();
    return newMessage;
  }

  // --- Observability & Usage Tracking ---
  logUsage(event: Omit<UsageEvent, 'id' | 'timestamp'>): UsageEvent {
    const newEvent: UsageEvent = {
      ...event,
      id: `use_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.usageEvents.unshift(newEvent);
    this.scheduleSave();
    return newEvent;
  }

  getUsageEvents(userId?: string): UsageEvent[] {
    if (userId) {
      return this.state.usageEvents.filter(e => e.userId === userId);
    }
    return [...this.state.usageEvents];
  }

  getStats(userId: string) {
    const userKbs = this.getKnowledgeBases(userId);
    const userDocs = this.getDocuments(userId);
    const userChats = this.getChats(userId);
    const userEvents = this.getUsageEvents(userId);

    const totalInputTokens = userEvents.reduce((s, e) => s + e.inputTokens, 0);
    const totalOutputTokens = userEvents.reduce((s, e) => s + e.outputTokens, 0);
    const totalCost = userEvents.reduce((s, e) => s + e.estimatedCost, 0);
    const avgLatency =
      userEvents.length > 0
        ? Math.round(
            userEvents.reduce((s, e) => s + e.totalLatencyMs, 0) /
              userEvents.length
          )
        : 0;

    return {
      knowledgeBaseCount: userKbs.length,
      documentCount: userDocs.length,
      chatCount: userChats.length,
      totalQueries: userEvents.length,
      totalInputTokens,
      totalOutputTokens,
      totalCost: Number(totalCost.toFixed(6)),
      avgLatencyMs: avgLatency,
    };
  }

  // Reset to initial seed
  reset(): void {
    this.state = createInitialSeed();
    this.persistToDiskSync(this.state);
  }
}

export const db = new DatabaseStore();
