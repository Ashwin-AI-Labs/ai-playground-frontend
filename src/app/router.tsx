import { Navigate, Route, Routes } from "react-router-dom";
import { ChatAssistantPage } from "../features/chat-assistant";
import { SemanticSearchPage } from "../features/semantic-search";
import { TaskAssistantPage } from "../features/task-assistant";
import { DashboardPage } from "../pages/DashboardPage";
import { FeaturePlaceholderPage } from "../pages/FeaturePlaceholderPage";
import { NotFoundPage } from "../pages/NotFoundPage";

/**
 * Central route table. Implemented features register pages here;
 * unimplemented ones fall through to FeaturePlaceholderPage via :featureId.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/features/chat-assistant" element={<ChatAssistantPage />} />
      <Route path="/features/task-assistant" element={<TaskAssistantPage />} />
      <Route path="/features/semantic-search" element={<SemanticSearchPage />} />
      <Route path="/features/:featureId" element={<FeaturePlaceholderPage />} />
      <Route path="*" element={<NotFoundPage />} />
      {/* Keep dashboard reachable if someone bookmarks old wildcards */}
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
