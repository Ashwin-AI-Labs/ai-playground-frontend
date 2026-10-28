export type DocumentStatus = "processing" | "completed" | "failed";

export type SearchDocument = {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: string;
  contentHash: string;
  status: DocumentStatus;
  errorMessage: string | null;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
  duplicateOf?: boolean;
};

export type SearchResult = {
  rank: number;
  documentId: string;
  filename: string;
  originalFilename: string;
  chunkId: string;
  chunkIndex: number;
  passage: string;
  similarity: number;
  similarityPercent: number;
  documentCreatedAt: string;
};

export type DocumentsListResponse = {
  success: boolean;
  documents: SearchDocument[];
  total: number;
  limit: number;
  offset: number;
};

export type DocumentResponse = {
  success: boolean;
  document: SearchDocument;
  duplicate?: boolean;
  message?: string;
};

export type SearchResponse = {
  success: boolean;
  query: string;
  results: SearchResult[];
  note?: string;
};
