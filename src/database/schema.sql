-- ==============================================================================
-- YAMA AI: PostgreSQL 15+ Schema with pgvector Extension & Multi-Tenant Indexes
-- Specification: Technical Design Document — Context-Aware RAG & LLM Platform
-- ==============================================================================

-- Enable vector extension for 768-dimensional dense embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Profiles Table (Onboarding Persona)
CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(64) NOT NULL,
    fields TEXT[] NOT NULL DEFAULT '{}',
    experience VARCHAR(32) NOT NULL,
    use_cases TEXT[] NOT NULL DEFAULT '{}',
    assistant_role VARCHAR(64) NOT NULL,
    custom_instructions TEXT,
    completed_onboarding BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Knowledge Bases Table
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(64) DEFAULT 'folder',
    color VARCHAR(32) DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_user_id ON knowledge_bases(user_id);

-- 4. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    knowledge_base_id VARCHAR(64) NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    size BIGINT NOT NULL,
    status VARCHAR(32) DEFAULT 'UPLOADED' NOT NULL, -- UPLOADED, PROCESSING, READY, FAILED, DELETED
    page_count INTEGER DEFAULT 0 NOT NULL,
    is_scanned BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
-- Compound index to enforce strict multi-tenant boundary
CREATE INDEX IF NOT EXISTS idx_documents_tenant_kb ON documents(user_id, knowledge_base_id);

-- 5. Document Chunks Table (Vector Store)
CREATE TABLE IF NOT EXISTS document_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    knowledge_base_id VARCHAR(64) NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    embedding vector(768) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
-- Strict Multi-Tenant Vector Index: Compound index on user_id + knowledge_base_id
CREATE INDEX IF NOT EXISTS idx_chunks_tenant ON document_chunks(user_id, knowledge_base_id);
-- Fast approximate nearest neighbor cosine search index
CREATE INDEX IF NOT EXISTS idx_chunks_vector_cosine ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 6. Chats Table
CREATE TABLE IF NOT EXISTS chats (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    knowledge_base_id VARCHAR(64) REFERENCES knowledge_bases(id) ON DELETE SET NULL,
    mode VARCHAR(32) NOT NULL, -- 'general' | 'rag'
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);

-- 7. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    chat_id VARCHAR(64) NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL, -- 'user' | 'assistant' | 'system'
    content TEXT NOT NULL,
    grounding_status VARCHAR(32), -- 'SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_FOUND'
    used_web_fallback BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);

-- 8. Chat Sources Table (Citations)
CREATE TABLE IF NOT EXISTS chat_sources (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    chunk_id VARCHAR(64) NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    relevance_score NUMERIC(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_sources_message ON chat_sources(message_id);

-- 9. Usage Events Table (Observability & Cost)
CREATE TABLE IF NOT EXISTS usage_events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id VARCHAR(64) REFERENCES chats(id) ON DELETE SET NULL,
    model VARCHAR(128) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    retrieval_latency_ms INTEGER DEFAULT 0,
    llm_latency_ms INTEGER DEFAULT 0,
    total_latency_ms INTEGER DEFAULT 0,
    estimated_cost NUMERIC(10, 6) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_usage_events_user ON usage_events(user_id);
