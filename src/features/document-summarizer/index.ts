export { DocumentSummarizerPage } from "./pages/DocumentSummarizerPage";

export const documentSummarizerFeature = {
  id: "summarizer",
  title: "AI Document Summarizer",
  description:
    "Condense long documents into clear summaries with controllable length using LangChain.js.",
  tech: "LangChain.js",
  path: "/features/summarizer",
} as const;
