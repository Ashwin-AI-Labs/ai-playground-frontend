import { request } from "../../../services/api/client";
import type {
  Task,
  TaskAssistantChatResponse,
  TaskPriority,
  TaskResponse,
  TasksResponse,
  TaskStatus,
} from "../types";

export const tasksApi = {
  listTasks: (params?: {
    status?: TaskStatus | "all";
    priority?: TaskPriority;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.priority) query.set("priority", params.priority);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<TasksResponse>(`/tasks${suffix}`);
  },
  getTask: (id: string) => request<TaskResponse>(`/tasks/${id}`),
  createTask: (body: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
  }) =>
    request<TaskResponse>("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTask: (
    id: string,
    body: {
      title?: string;
      description?: string | null;
      priority?: TaskPriority;
      status?: TaskStatus;
      dueDate?: string | null;
    },
  ) =>
    request<TaskResponse>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  requestDeleteTask: (id: string) =>
    request<{
      success: boolean;
      requiresConfirmation: boolean;
      confirmationToken: string;
      task: Task;
      message?: string;
    }>(`/tasks/${id}/request-delete`, {
      method: "POST",
    }),
  confirmDeleteTask: (id: string, confirmationToken: string) =>
    request<TaskResponse>(`/tasks/${id}/confirm-delete`, {
      method: "POST",
      body: JSON.stringify({ confirmationToken }),
    }),
  sendTaskAssistantMessage: (
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ) =>
    request<TaskAssistantChatResponse>("/task-assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
