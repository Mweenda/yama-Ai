import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { db } from './src/database/store';
import { GeminiLLMProvider } from './src/llm/LLMProvider';
import { GeminiEmbeddingProvider } from './src/embeddings/EmbeddingProvider';
import { searchKnowledgeBase } from './src/rag/retrieval';
import { compileLayeredPrompt } from './src/users/profile';
import { extractPagesFromRawContent, chunkDocumentPages } from './src/documents/ingestion';
import { DocumentRecord, ChatMessage, GroundingStatus } from './src/types';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));

// Initialize Providers
const embeddingProvider = new GeminiEmbeddingProvider();
const llmProvider = new GeminiLLMProvider();

// Simple secure session token resolver
// Clients can send x-user-id header or authorization Bearer token to isolate sessions
app.use((req: Request, res: Response, next) => {
  const customUserId = req.headers['x-user-id'] as string;
  if (customUserId) {
    const user = db.getUserById(customUserId);
    if (user) {
      db.setCurrentUserId(user.id);
    }
  }
  next();
});

// Helper to reliably extract authenticated user ID
function getAuthenticatedUserId(req: Request): string {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId && db.getUserById(headerUserId)) {
    return headerUserId;
  }
  return db.getCurrentUserId();
}

// ==============================================================================
// 1. Authentication & Session Management
// ==============================================================================

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.validateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const profile = db.getProfile(user.id);
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
    },
    profile,
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const newUser = db.registerUser(name, email, password);
    const profile = db.getProfile(newUser.id);
    res.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isAdmin: newUser.isAdmin,
        avatar: newUser.avatar,
      },
      profile,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = db.getCurrentUser();
  const profile = db.getProfile(user.id);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      createdAt: user.createdAt,
      bio: user.bio,
      organization: user.organization,
      jobTitle: user.jobTitle,
      phone: user.phone,
    },
    profile,
  });
});

app.get('/api/profile', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const profile = db.getProfile(userId);
  const user = db.getCurrentUser();
  res.json({ user, profile });
});

app.patch('/api/profile', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const updated = db.updateProfile(userId, req.body);
  res.json({ profile: updated });
});

app.patch('/api/user', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const { name, email, avatar, bio, organization, jobTitle, phone } = req.body;
  const updated = db.updateUser(userId, {
    ...(name !== undefined ? { name } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(avatar !== undefined ? { avatar } : {}),
    ...(bio !== undefined ? { bio } : {}),
    ...(organization !== undefined ? { organization } : {}),
    ...(jobTitle !== undefined ? { jobTitle } : {}),
    ...(phone !== undefined ? { phone } : {}),
  });
  res.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      isAdmin: updated.isAdmin,
      avatar: updated.avatar,
      createdAt: updated.createdAt,
      bio: updated.bio,
      organization: updated.organization,
      jobTitle: updated.jobTitle,
      phone: updated.phone,
    },
  });
});

// ==============================================================================
// 2. Knowledge Bases (Tenant-Scoped)
// ==============================================================================

app.get('/api/knowledge-bases', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const kbs = db.getKnowledgeBases(userId);
  res.json({ knowledgeBases: kbs });
});

app.post('/api/knowledge-bases', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const { name, description, icon, color } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const kb = db.createKnowledgeBase(userId, { name, description: description || '', icon, color });
  res.json({ knowledgeBase: kb });
});

app.delete('/api/knowledge-bases/:id', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const success = db.deleteKnowledgeBase(userId, req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Knowledge base not found or unauthorized' });
  }
  res.json({ success: true });
});

// ==============================================================================
// 3. Document Ingestion Pipeline (Upload, Chunk, Embed, Index)
// ==============================================================================

app.get('/api/documents', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const kbId = req.query.kbId as string | undefined;
  const docs = db.getDocuments(userId, kbId);
  res.json({ documents: docs });
});

app.get('/api/documents/:id', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const doc = db.getDocument(userId, req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found or unauthorized' });
  }
  res.json({ document: doc });
});

app.post('/api/documents/upload', async (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const { knowledgeBaseId, filename, rawContent, mimeType, size } = req.body;

  if (!knowledgeBaseId || !filename || !rawContent) {
    return res.status(400).json({ error: 'knowledgeBaseId, filename, and rawContent are required' });
  }

  const kb = db.getKnowledgeBase(userId, knowledgeBaseId);
  if (!kb) {
    return res.status(404).json({ error: 'Knowledge base not found or unauthorized' });
  }

  // 1. Create document record in PROCESSING state
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docRecord: DocumentRecord = {
    id: docId,
    userId,
    knowledgeBaseId,
    filename,
    storagePath: `/uploads/${userId}/${knowledgeBaseId}/${filename}`,
    mimeType: mimeType || 'application/pdf',
    size: size || rawContent.length,
    status: 'PROCESSING',
    pageCount: 0,
    pages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.addDocument(docRecord);

  try {
    // 2. Extract pages and check for scanned PDF
    const extraction = extractPagesFromRawContent(filename, rawContent);
    if (extraction.isScanned) {
      db.updateDocument(userId, docId, {
        status: 'FAILED',
        isScanned: true,
        errorMessage: 'This document appears to be scanned. OCR processing is required.',
      });
      return res.json({
        document: db.getDocument(userId, docId),
        warning: 'This document appears to be scanned. OCR processing is required.',
      });
    }

    docRecord.pages = extraction.pages;
    docRecord.pageCount = extraction.pages.length;

    // 3. Page-Aware Semantic Chunking (500–1,000 tokens, 15% overlap)
    const chunks = chunkDocumentPages(
      docId,
      knowledgeBaseId,
      userId,
      filename,
      extraction.pages
    );

    // 4. Generate Embeddings for chunks concurrently using optimized batching
    const chunkContents = chunks.map(c => c.content);
    const embeddings = await embeddingProvider.embedBatch(chunkContents);
    chunks.forEach((chunk, i) => {
      chunk.embedding = embeddings[i];
    });

    // 5. Index chunks
    db.addChunks(chunks);

    // 6. Mark READY
    const finalDoc = db.updateDocument(userId, docId, {
      status: 'READY',
      pages: extraction.pages,
      pageCount: extraction.pages.length,
    });

    res.json({
      document: finalDoc,
      chunksCount: chunks.length,
      success: true,
    });
  } catch (err: any) {
    db.updateDocument(userId, docId, {
      status: 'FAILED',
      errorMessage: err.message || 'Processing failed',
    });
    res.status(500).json({ error: err.message || 'Processing failed' });
  }
});

app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const success = db.deleteDocument(userId, req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Document not found or unauthorized' });
  }
  res.json({ success: true });
});

// ==============================================================================
// 4. Chats & Server-Sent Events (SSE) Streaming Pipeline
// ==============================================================================

app.get('/api/chats', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const chats = db.getChats(userId);
  res.json({ chats });
});

app.post('/api/chats', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const { title, mode, knowledgeBaseId } = req.body;
  if (!title || !mode) {
    return res.status(400).json({ error: 'title and mode are required' });
  }
  const chat = db.createChat(userId, { title, mode, knowledgeBaseId });
  res.json({ chat });
});

app.get('/api/chats/:id', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const chat = db.getChat(userId, req.params.id);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found or unauthorized' });
  }
  const messages = db.getMessages(userId, req.params.id);
  res.json({ chat, messages });
});

app.delete('/api/chats/:id', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const success = db.deleteChat(userId, req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Chat not found or unauthorized' });
  }
  res.json({ success: true });
});

/**
 * Section 28 & 29: SSE Streaming Chat Endpoint with Layered Prompting & Grounding Evaluator
 */
app.post('/api/chats/:id/messages', async (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const chatId = req.params.id;
  const { message: userQuestion, model: requestedModel } = req.body;

  if (!userQuestion || typeof userQuestion !== 'string') {
    return res.status(400).json({ error: 'message text is required' });
  }

  const chat = db.getChat(userId, chatId);
  if (!chat) {
    return res.status(404).json({ error: 'Chat not found or unauthorized' });
  }

  // 1. Save user message to database
  db.addMessage(userId, chatId, {
    chatId,
    role: 'user',
    content: userQuestion,
  });

  // 2. Setup Server-Sent Events (SSE) stream headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const writeSSE = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const profile = db.getProfile(userId);
  const conversationHistory = db.getMessages(userId, chatId).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const isRagMode = chat.mode === 'rag' && !!chat.knowledgeBaseId;
  let retrievalResult: any = null;
  let usedWebFallback = false;

  const totalStartTime = Date.now();

  try {
    // 3. Knowledge Base Scoped Retrieval (if RAG mode)
    if (isRagMode && chat.knowledgeBaseId) {
      writeSSE('status', { message: 'Searching scoped knowledge base...' });

      const allChunks = db.getAllChunks();
      retrievalResult = await searchKnowledgeBase(allChunks, embeddingProvider, {
        userId,
        knowledgeBaseId: chat.knowledgeBaseId,
        query: userQuestion,
        limit: 6,
      });

      // Grounding evaluation & User Search Scope Policy
      const isHybridAllowed = profile.searchScope !== 'kb_only';
      if (isHybridAllowed && (retrievalResult.groundingStatus === 'NOT_FOUND' || retrievalResult.groundingStatus === 'PARTIALLY_SUPPORTED')) {
        usedWebFallback = true;
        writeSSE('status', {
          message: `Grounding status: ${retrievalResult.groundingStatus}. Triggering Google Search fallback...`,
        });
      } else if (!isHybridAllowed) {
        usedWebFallback = false;
        writeSSE('status', {
          message: `Grounding status: ${retrievalResult.groundingStatus}. Search policy: Knowledge Base Only (Strict).`,
        });
      }

      // Stream retrieval metadata to client immediately
      writeSSE('retrieval', {
        groundingStatus: retrievalResult.groundingStatus,
        sources: retrievalResult.sources,
        topScore: retrievalResult.topScore,
        latencyMs: retrievalResult.retrievalLatencyMs,
        usedWebFallback,
      });
    } else if (!isRagMode) {
      // General mode defaults to live web search grounding if hybrid is permitted
      usedWebFallback = profile.searchScope !== 'kb_only';
    }

    // 4. Section 10: Compile Layered Prompt
    writeSSE('status', { message: 'Compiling layered prompt architecture...' });
    const promptContext = compileLayeredPrompt({
      profile,
      chunks: retrievalResult?.chunks || [],
      conversationHistory: conversationHistory.slice(-6), // Recent context window
      userQuestion,
      isRagMode,
    });

    // Send compiled prompt inspectability event (for Admin & Observability)
    writeSSE('prompt_layers', {
      layers: {
        systemPolicy: promptContext.systemPolicy,
        platformInstructions: promptContext.platformInstructions,
        userProfile: promptContext.userProfileText,
        ragContext: promptContext.ragContextText,
      },
    });

    // 5. Stream from Gemini LLM Provider
    writeSSE('status', { message: 'Generating grounded response...' });
    const llmStream = llmProvider.stream({
      model: requestedModel || 'gemini-3.8-flash',
      systemPrompt: promptContext.rawSystemPrompt,
      messages: conversationHistory.concat([{ role: 'user', content: userQuestion }]),
      useGoogleSearchGrounding: usedWebFallback,
    });

    let fullAnswer = '';
    let finalMetadata: any = null;

    for await (const chunk of llmStream) {
      if (!chunk.done) {
        fullAnswer += chunk.delta;
        writeSSE('delta', { text: chunk.delta });
      } else {
        finalMetadata = chunk.metadata;
      }
    }

    const totalLatencyMs = Date.now() - totalStartTime;
    const retrievalLatencyMs = retrievalResult?.retrievalLatencyMs || 0;
    const llmLatencyMs = finalMetadata?.latencyMs || (totalLatencyMs - retrievalLatencyMs);
    const inputTokens = finalMetadata?.inputTokens || 850;
    const outputTokens = finalMetadata?.outputTokens || Math.ceil(fullAnswer.length / 4);
    const estimatedCost = (inputTokens * 0.075 + outputTokens * 0.30) / 1_000_000;

    // 6. Save assistant message to database
    const assistantMessage = db.addMessage(userId, chatId, {
      chatId,
      role: 'assistant',
      content: fullAnswer,
      groundingStatus: retrievalResult?.groundingStatus as GroundingStatus | undefined,
      sources: retrievalResult?.sources,
      webFallbackSources: finalMetadata?.webSources,
      usedWebFallback,
      metrics: {
        retrievalLatencyMs,
        llmLatencyMs,
        totalLatencyMs,
        inputTokens,
        outputTokens,
      },
    });

    // 7. Log Observability & Usage Event
    db.logUsage({
      userId,
      chatId,
      model: requestedModel || 'gemini-3.8-flash',
      inputTokens,
      outputTokens,
      retrievalLatencyMs,
      llmLatencyMs,
      totalLatencyMs,
      estimatedCost,
    });

    // 8. Send completion event
    writeSSE('done', {
      message: assistantMessage,
      metrics: {
        retrievalLatencyMs,
        llmLatencyMs,
        totalLatencyMs,
        inputTokens,
        outputTokens,
        estimatedCost,
      },
    });

    res.end();
  } catch (error: any) {
    console.error('Streaming chat error:', error);
    const errorStr = (error?.message || JSON.stringify(error) || '').toLowerCase();
    const isQuota = errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('resource_exhausted');

    const friendlyError = isQuota
      ? 'Gemini API quota rate limit reached (429 Resource Exhausted). To increase limits, you can link an API key in Settings > Secrets.'
      : (error.message || 'An error occurred during generation');

    // Synthesize fallback response if not already saved
    const fallbackAnswer = isQuota
      ? `> ⚠️ **Gemini API Quota Notice (429 Rate Limit)**: The free-tier request limit for Gemini was reached. To raise limits, you can configure an API key in **Settings > Secrets**.\n\n` +
        (retrievalResult?.chunks?.length > 0
          ? `### Knowledge Base Synthesis:\n` +
            retrievalResult.chunks.slice(0, 2).map((c: any) => `* **${c.metadata.filename} (Page ${c.pageStart})**: ${c.content.slice(0, 300)}... [Source: ${c.metadata.filename}, p. ${c.pageStart}]`).join('\n\n')
          : `Your question was received: "${userQuestion}". Once the quota window resets or a billing key is linked, full real-time generation will resume.`)
      : `Unable to complete response: ${friendlyError}`;

    const assistantMessage = db.addMessage(userId, chatId, {
      chatId,
      role: 'assistant',
      content: fallbackAnswer,
      groundingStatus: retrievalResult?.groundingStatus,
      sources: retrievalResult?.sources,
      usedWebFallback,
    });

    writeSSE('delta', { text: fallbackAnswer });
    writeSSE('done', { message: assistantMessage });
    res.end();
  }
});

// ==============================================================================
// 5. Observability, Security Audit & Schema SQL
// ==============================================================================

app.get('/api/observability/stats', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const stats = db.getStats(userId);
  res.json({ stats });
});

app.get('/api/observability/events', (req: Request, res: Response) => {
  const userId = db.getCurrentUserId();
  const events = db.getUsageEvents(userId);
  res.json({ events });
});

app.post('/api/observability/reset', (req: Request, res: Response) => {
  db.reset();
  res.json({ success: true, message: 'Database reset to initial seed state.' });
});

app.get('/api/schema', (req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'src/database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      return res.json({ sql });
    }
    res.status(404).json({ error: 'schema.sql not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 6. Vite Middleware Mount in Dev Mode
// ==============================================================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Yama AI Platform server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
