import { chatAssistantFeature } from "./chat-assistant";
import { documentSummarizerFeature } from "./document-summarizer";
import { pdfRagFeature } from "./pdf-rag";
import { researchAgentFeature } from "./research-agent";
import { semanticSearchFeature } from "./semantic-search";
import { taskAssistantFeature } from "./task-assistant";

export type Feature = {
  id: string;
  title: string;
  description: string;
  tech: string;
  path: string;
};

/** Dashboard catalog — each feature module owns its metadata. */
export const features: Feature[] = [
  chatAssistantFeature,
  taskAssistantFeature,
  semanticSearchFeature,
  pdfRagFeature,
  documentSummarizerFeature,
  researchAgentFeature,
];

export function getFeatureById(id: string): Feature | undefined {
  return features.find((feature) => feature.id === id);
}
