export { PdfRagPage } from "./pages/PdfRagPage";
export { ragApi } from "./api/ragApi";
export type { RagAskData, RagCitation, RagDocument } from "./types";

export const pdfRagFeature = {
  id: "pdf-qa",
  title: "PDF Question Answering",
  description:
    "Ask questions against uploaded PDFs using retrieval-augmented generation.",
  tech: "RAG",
  path: "/features/pdf-qa",
} as const;
