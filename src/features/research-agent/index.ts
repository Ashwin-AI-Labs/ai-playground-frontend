export { ResearchAgentPage } from "./pages/ResearchAgentPage";

export const researchAgentFeature = {
  id: "research-agent",
  title: "AI Research Assistant",
  description:
    "Web search, source-backed reports, validated citations, and saved research sessions.",
  tech: "Tavily + LLM + SSRF-safe fetch",
  path: "/features/research-agent",
} as const;
