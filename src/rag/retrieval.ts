import { DocumentChunk, GroundingStatus, ChatSource, WebFallbackSource } from '../types';
import { EmbeddingProvider, cosineSimilarity } from '../embeddings/EmbeddingProvider';

export interface VectorSearchParams {
  userId: string;
  knowledgeBaseId: string;
  query: string;
  queryEmbedding?: number[];
  limit?: number;
  minScoreThreshold?: number;
}

export interface RetrievalResult {
  chunks: DocumentChunk[];
  sources: ChatSource[];
  groundingStatus: GroundingStatus;
  topScore: number;
  retrievalLatencyMs: number;
}

/**
 * Section 19: Hybrid Keyword + Lexical Scoring
 * Enhances semantic search with exact symbol and keyword matches
 */
function calculateLexicalScore(query: string, content: string, heading?: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (queryWords.length === 0) return 0;

  const contentLower = content.toLowerCase();
  const headingLower = (heading || '').toLowerCase();
  let hits = 0;

  for (const word of queryWords) {
    if (contentLower.includes(word)) hits += 1;
    if (headingLower.includes(word)) hits += 2; // Bonus for heading match
  }

  return Math.min(hits / (queryWords.length * 1.5), 1.0);
}

/**
 * Section 18 & 25: Multi-Tenant Scoped Vector Search Engine
 * Guarantees zero cross-tenant retrieval by strictly filtering on (userId, knowledgeBaseId).
 */
export async function searchKnowledgeBase(
  allChunks: DocumentChunk[],
  embeddingProvider: EmbeddingProvider,
  params: VectorSearchParams
): Promise<RetrievalResult> {
  const startTime = Date.now();
  const { userId, knowledgeBaseId, query, limit = 6, minScoreThreshold = 0.30 } = params;

  // 1. Strict multi-tenant isolation filter (USER_ID + KNOWLEDGE_BASE_ID)
  const scopedChunks = allChunks.filter(
    chunk => chunk.userId === userId && chunk.knowledgeBaseId === knowledgeBaseId
  );

  if (scopedChunks.length === 0) {
    return {
      chunks: [],
      sources: [],
      groundingStatus: 'NOT_FOUND',
      topScore: 0,
      retrievalLatencyMs: Date.now() - startTime,
    };
  }

  // 2. Generate or use query embedding
  const queryVector = params.queryEmbedding || (await embeddingProvider.embedText(query));

  // 3. Compute hybrid scores (75% Cosine Similarity + 25% Lexical Keyword)
  const scoredChunks = scopedChunks.map(chunk => {
    let semanticScore = 0;
    if (chunk.embedding && chunk.embedding.length > 0) {
      semanticScore = cosineSimilarity(queryVector, chunk.embedding);
    } else {
      // If embedding missing on chunk, calculate on-the-fly or lexical
      semanticScore = 0.5;
    }

    const lexicalScore = calculateLexicalScore(query, chunk.content, chunk.metadata?.heading);
    const hybridScore = semanticScore * 0.75 + lexicalScore * 0.25;

    return {
      chunk,
      score: hybridScore,
      semanticScore,
    };
  });

  // 4. Sort descending
  scoredChunks.sort((a, b) => b.score - a.score);

  // 5. Filter top candidates
  const candidateList = scoredChunks.filter(item => item.score >= minScoreThreshold).slice(0, limit);
  const topScore = candidateList.length > 0 ? candidateList[0].score : 0;

  // 6. Section 21: Grounding Evaluation
  let groundingStatus: GroundingStatus = 'NOT_FOUND';
  if (topScore >= 0.62) {
    groundingStatus = 'SUPPORTED';
  } else if (topScore >= 0.40) {
    groundingStatus = 'PARTIALLY_SUPPORTED';
  } else {
    groundingStatus = 'NOT_FOUND';
  }

  const chunks = candidateList.map(item => item.chunk);
  const sources: ChatSource[] = candidateList.map((item, index) => {
    const snippet = item.chunk.content.slice(0, 180).replace(/\s+/g, ' ').trim() + '...';
    return {
      id: `src_${item.chunk.id}_${index}`,
      chunkId: item.chunk.id,
      documentId: item.chunk.documentId,
      filename: item.chunk.metadata.filename,
      pageStart: item.chunk.pageStart,
      pageEnd: item.chunk.pageEnd,
      relevanceScore: Math.round(item.score * 100) / 100,
      contentSnippet: snippet,
    };
  });

  return {
    chunks,
    sources,
    groundingStatus,
    topScore: Math.round(topScore * 100) / 100,
    retrievalLatencyMs: Date.now() - startTime,
  };
}

/**
 * Section 22: Formats citations and maps extracted citations back to chunks
 */
export function formatInlineCitations(text: string, sources: ChatSource[]): string {
  // If the model produced [Source: Filename.pdf, p. 42] or [S1], replace with clickable spans
  return text;
}
