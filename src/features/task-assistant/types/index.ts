/** Database BIGINT identity values are serialized as decimal strings. */
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskAction = {
  tool: string;
  ok: boolean;
  summary: string;
  data?: unknown;
};

export type PendingDelete = {
  taskId: string;
  confirmationToken: string;
  task: Task;
};

export type TaskAssistantChatResponse = {
  success: boolean;
  reply: string;
  actions: TaskAction[];
  pendingDelete: PendingDelete | null;
  iterations: number;
};

export type TasksResponse = {
  success: boolean;
  tasks: Task[];
};

export type TaskResponse = {
  success: boolean;
  task: Task;
};
