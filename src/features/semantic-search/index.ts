export { SemanticSearchPage } from "./pages/SemanticSearchPage";
export { semanticSearchApi } from "./api/semanticSearchApi";
export type { SearchDocument, SearchResult } from "./types";

export const semanticSearchFeature = {
  id: "semantic-search",
  title: "Semantic Document Search",
  description:
    "Find relevant passages by meaning instead of exact keyword matches.",
  tech: "Embeddings & vector search",
  path: "/features/semantic-search",
} as const;
