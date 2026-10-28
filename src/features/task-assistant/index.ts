export { TaskAssistantPage } from "./pages/TaskAssistantPage";
export { TaskForm } from "./components/TaskForm";
export { tasksApi } from "./api/tasksApi";
export type { Task, TaskPriority, TaskStatus } from "./types";

export const taskAssistantFeature = {
  id: "task-assistant",
  title: "AI Task Assistant",
  description:
    "Structured task workflows that call tools and return actionable results.",
  tech: "OpenAI tool calling",
  path: "/features/task-assistant",
} as const;
