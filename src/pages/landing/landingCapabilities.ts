import { chatAssistantFeature } from "../../features/chat-assistant";
import { documentSummarizerFeature } from "../../features/document-summarizer";
import { pdfRagFeature } from "../../features/pdf-rag";
import { researchAgentFeature } from "../../features/research-agent";
import { semanticSearchFeature } from "../../features/semantic-search";
import { taskAssistantFeature } from "../../features/task-assistant";

export type LandingCapability = {
  id: string;
  category: string;
  title: string;
  description: string;
  path: string;
  accent: "indigo" | "violet" | "sky" | "teal" | "amber" | "rose";
  icon: "message" | "tasks" | "search" | "files" | "summarize" | "research";
};

/**
 * Landing-page presentation copy. Paths come from the live feature modules
 * so cards always navigate to the real registered routes.
 */
export const landingCapabilities: LandingCapability[] = [
  {
    id: chatAssistantFeature.id,
    path: chatAssistantFeature.path,
    category: "Conversation",
    title: "AI Chat Assistant",
    description:
      "Have natural conversations with AI and get help with questions, ideas, and everyday tasks.",
    accent: "indigo",
    icon: "message",
  },
  {
    id: taskAssistantFeature.id,
    path: taskAssistantFeature.path,
    category: "Automation",
    title: "AI Task Assistant",
    description:
      "Turn requests into structured actions with AI-powered tool calling and task management.",
    accent: "violet",
    icon: "tasks",
  },
  {
    id: semanticSearchFeature.id,
    path: semanticSearchFeature.path,
    category: "Knowledge retrieval",
    title: "Semantic Document Search",
    description:
      "Find relevant document passages using meaning-based search instead of exact keyword matches.",
    accent: "sky",
    icon: "search",
  },
  {
    id: pdfRagFeature.id,
    path: pdfRagFeature.path,
    category: "Document intelligence",
    title: "PDF Question Answering",
    description:
      "Ask questions about uploaded PDFs and explore answers grounded in retrieved document passages.",
    accent: "teal",
    icon: "files",
  },
  {
    id: documentSummarizerFeature.id,
    path: documentSummarizerFeature.path,
    category: "LangChain",
    title: "AI Document Summarizer",
    description:
      "Turn lengthy documents into concise summaries, key points, and actionable information.",
    accent: "amber",
    icon: "summarize",
  },
  {
    id: researchAgentFeature.id,
    path: researchAgentFeature.path,
    category: "Research",
    title: "AI Research Assistant",
    description:
      "Explore topics through web search and generate structured reports with source references.",
    accent: "rose",
    icon: "research",
  },
];
