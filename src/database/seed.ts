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

export interface DatabaseState {
  users: User[];
  profiles: Record<string, UserProfile>;
  knowledgeBases: KnowledgeBase[];
  documents: DocumentRecord[];
  chunks: DocumentChunk[];
  chats: Chat[];
  messages: Record<string, ChatMessage[]>;
  usageEvents: UsageEvent[];
}

export function createInitialSeed(): DatabaseState {
  const users: User[] = [
    {
      id: 'admin_christopher',
      email: 'yama.ai@admin.io',
      name: 'Christopher Kawanga',
      password: 'Admin{12345}',
      isAdmin: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      createdAt: '2026-10-01T08:00:00Z',
    },
  ];

  const profiles: Record<string, UserProfile> = {
    'admin_christopher': {
      userId: 'admin_christopher',
      role: 'Administrator',
      fields: ['Computer Science', 'Artificial Intelligence', 'Electrical Engineering'],
      experience: 'Expert',
      useCases: ['Document Synthesis', 'Literature Research', 'Technical Writing'],
      assistantRole: 'Research Assistant',
      customInstructions: 'Provide clear, authoritative synthesis with verifiable page citations.',
      completedOnboarding: true,
      updatedAt: new Date().toISOString(),
    },
  };

  return {
    users,
    profiles,
    knowledgeBases: [],
    documents: [],
    chunks: [],
    chats: [],
    messages: {},
    usageEvents: [],
  };
}
