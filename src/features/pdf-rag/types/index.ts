export type RagDocument = {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: string;
  status: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RagCitation = {
  id: number;
  documentId: string;
  filename: string;
  chunkId: string;
  pageNumber: number | null;
  pageEnd: number | null;
  pageAvailable: boolean;
  excerpt: string;
  similarity: number;
};

export type RagAskData = {
  sessionId: string;
  answer: string;
  insufficientEvidence: boolean;
  citations: RagCitation[];
  retrieval: {
    returnedChunks: number;
    topK: number;
    minSimilarity: number;
    documentFilterApplied: boolean;
  };
};

export type RagSessionSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type RagMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  insufficientEvidence: boolean;
  citations: RagCitation[];
  createdAt: string;
};
