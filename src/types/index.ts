export type UserRole = 'Student' | 'Researcher' | 'Professional' | 'Administrator' | 'General User' | 'Other';

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type AssistantRole = 
  | 'Tutor' 
  | 'Research Assistant' 
  | 'Study Partner' 
  | 'Professional Assistant' 
  | 'Writing Assistant' 
  | 'Analyst' 
  | 'General Assistant' 
  | 'Custom';

export type ChatMode = 'general' | 'rag';

export type GroundingStatus = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_FOUND';

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAdmin?: boolean;
  password?: string;
  createdAt: string;
  bio?: string;
  organization?: string;
  phone?: string;
  jobTitle?: string;
}

export interface UserProfile {
  userId: string;
  role: UserRole;
  fields: string[];
  experience: ExperienceLevel;
  useCases: string[];
  assistantRole: AssistantRole;
  customInstructions: string;
  searchScope?: 'kb_only' | 'hybrid';
  completedOnboarding: boolean;
  updatedAt: string;
}

export interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  documentCount: number;
  totalChunks: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  knowledgeBaseId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  pageCount: number;
  pages: DocumentPage[];
  errorMessage?: string;
  isScanned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  knowledgeBaseId: string;
  userId: string;
  chunkIndex: number;
  content: string;
  pageStart: number;
  pageEnd: number;
  embedding: number[];
  metadata: {
    heading?: string;
    section?: string;
    tokenCount: number;
    filename: string;
  };
}

export interface ChatSource {
  id: string;
  chunkId: string;
  documentId: string;
  filename: string;
  pageStart: number;
  pageEnd: number;
  relevanceScore: number;
  contentSnippet: string;
}

export interface WebFallbackSource {
  title: string;
  url: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  groundingStatus?: GroundingStatus;
  sources?: ChatSource[];
  webFallbackSources?: WebFallbackSource[];
  usedWebFallback?: boolean;
  metrics?: {
    retrievalLatencyMs?: number;
    llmLatencyMs?: number;
    totalLatencyMs?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
  createdAt: string;
}

export interface Chat {
  id: string;
  userId: string;
  knowledgeBaseId?: string;
  mode: ChatMode;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageEvent {
  id: string;
  userId: string;
  chatId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  retrievalLatencyMs: number;
  llmLatencyMs: number;
  totalLatencyMs: number;
  estimatedCost: number;
  timestamp: string;
}

export interface LayeredPromptContext {
  systemPolicy: string;
  platformInstructions: string;
  userProfileText: string;
  chatInstructions: string;
  ragContextText: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  userQuestion: string;
  rawSystemPrompt: string;
}
