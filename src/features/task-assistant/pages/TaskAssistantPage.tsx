import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../../services/api/client";
import { tasksApi } from "../api/tasksApi";
import { TaskForm, type TaskFormValues } from "../components/TaskForm";
import type {
  PendingDelete,
  Task,
  TaskAction,
  TaskPriority,
  TaskStatus,
} from "../types";

type UiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: TaskAction[];
};

type StatusFilter = TaskStatus | "all";

const SUGGESTIONS = [
  "Create a high-priority task to finish the demo.",
  "List my pending tasks.",
  "Show my high-priority tasks.",
  "Mark task 1 as completed.",
];

function priorityClass(priority: Task["priority"]): string {
  if (priority === "high") {
    return "border-[var(--color-danger)]/40 text-[var(--color-danger)]";
  }
  if (priority === "medium") {
    return "border-[var(--color-warn)]/40 text-[var(--color-warn)]";
  }
  return "border-white/20 text-[var(--color-ink-300)]";
}

function statusClass(status: Task["status"]): string {
  if (status === "completed") {
    return "border-[var(--color-accent)]/40 text-[var(--color-accent)]";
  }
  if (status === "in_progress") {
    return "border-sky-400/40 text-sky-300";
  }
  return "border-white/20 text-[var(--color-ink-300)]";
}

function toIsoDueDate(localValue: string): string | null {
  if (!localValue.trim()) {
    return null;
  }
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function TaskAssistantPage() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const response = await tasksApi.listTasks({
        status: statusFilter,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        limit: 100,
      });
      setTasks(response.tasks);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function pushSystemNotice(content: string) {
    setMessages((current) => [
      ...current,
      {
        id: `system-${Date.now()}`,
        role: "system",
        content,
      },
    ]);
  }

  function startNewConversation() {
    setMessages([]);
    setDraft("");
    setError(null);
    setPendingDelete(null);
  }

  async function sendMessage(raw: string) {
    const message = raw.trim();
    if (!message || sending) {
      return;
    }

    setSending(true);
    setError(null);
    setNotice(null);
    setDraft("");

    const history = messages
      .filter((entry) => entry.role === "user" || entry.role === "assistant")
      .map((entry) => ({
        role: entry.role as "user" | "assistant",
        content: entry.content,
      }));

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
      },
    ]);

    try {
      const response = await tasksApi.sendTaskAssistantMessage(message, history);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          actions: response.actions,
        },
      ]);

      if (response.pendingDelete) {
        setPendingDelete(response.pendingDelete);
      }

      await loadTasks();
    } catch (err) {
      setDraft(message);
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to reach the task assistant.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(draft);
  }

  async function handleCreate(values: TaskFormValues) {
    setSavingManual(true);
    setError(null);
    setNotice(null);
    try {
      const response = await tasksApi.createTask({
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        dueDate: toIsoDueDate(values.dueDate) ?? undefined,
      });

      if (values.status !== "pending") {
        await tasksApi.updateTask(response.task.id, { status: values.status });
      }

      setNotice(`Created task #${response.task.id}: ${response.task.title}`);
      pushSystemNotice(
        `Manual create: task #${response.task.id} “${response.task.title}” was saved.`,
      );
      await loadTasks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create task.");
    } finally {
      setSavingManual(false);
    }
  }

  async function handleUpdate(values: TaskFormValues) {
    if (!editingTask) {
      return;
    }

    setSavingManual(true);
    setError(null);
    setNotice(null);
    try {
      const response = await tasksApi.updateTask(editingTask.id, {
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        status: values.status,
        dueDate: toIsoDueDate(values.dueDate),
      });
      setEditingTask(null);
      setNotice(`Updated task #${response.task.id}`);
      pushSystemNotice(
        `Manual update: task #${response.task.id} “${response.task.title}” was saved.`,
      );
      await loadTasks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update task.");
    } finally {
      setSavingManual(false);
    }
  }

  async function quickUpdateStatus(task: Task, status: TaskStatus) {
    setError(null);
    setNotice(null);
    try {
      const response = await tasksApi.updateTask(task.id, { status });
      setNotice(`Task #${response.task.id} marked ${status.replace("_", " ")}`);
      await loadTasks();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status.");
    }
  }

  async function requestManualDelete(task: Task) {
    setError(null);
    setNotice(null);
    try {
      const response = await tasksApi.requestDeleteTask(task.id);
      setPendingDelete({
        taskId: response.task.id,
        confirmationToken: response.confirmationToken,
        task: response.task,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to prepare deletion.",
      );
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setConfirmingDelete(true);
    setError(null);
    try {
      const response = await tasksApi.confirmDeleteTask(
        pendingDelete.taskId,
        pendingDelete.confirmationToken,
      );
      setPendingDelete(null);
      if (editingTask?.id === response.task.id) {
        setEditingTask(null);
      }
      setNotice(`Deleted task #${response.task.id}`);
      pushSystemNotice(
        `Deleted task #${response.task.id}: ${response.task.title}.`,
      );
      await loadTasks();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to confirm task deletion.",
      );
    } finally {
      setConfirmingDelete(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/"
            className="text-sm text-[var(--color-ink-400)] transition hover:text-[var(--color-accent)]"
          >
            ← Back to dashboard
          </Link>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">
            AI Task Assistant
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-400)]">
            Manage tasks manually with full CRUD, or ask the assistant in chat.
            Both paths write to the same PostgreSQL tasks table.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewConversation}
          className="rounded-lg border border-white/15 bg-[var(--color-surface-800)] px-4 py-2 text-sm font-medium transition hover:border-[var(--color-accent)]/50"
        >
          New chat
        </button>
      </div>

      {(error || notice) && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10"
              : "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p>{error ?? notice}</p>
            <button
              type="button"
              className="text-xs text-[var(--color-ink-300)] underline-offset-2 hover:underline"
              onClick={() => {
                setError(null);
                setNotice(null);
              }}
            >
              Dismiss
            </button>
          </div>
          {error ? (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-[var(--color-accent)]"
              onClick={() => {
                setError(null);
                void loadTasks();
              }}
            >
              Retry load
            </button>
          ) : null}
        </div>
      )}

      <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <section className="flex min-h-[70vh] flex-col rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Chat CRUD
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={sending}
                  onClick={() => {
                    void sendMessage(suggestion);
                  }}
                  className="rounded-lg border border-white/10 bg-[var(--color-surface-900)] px-3 py-1.5 text-left text-xs text-[var(--color-ink-300)] transition hover:border-[var(--color-accent)]/40 hover:text-[var(--color-ink-100)] disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            {messages.length === 0 && !sending ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <p className="font-display text-xl font-semibold">
                  Chat or use the manual panel
                </p>
                <p className="mt-2 max-w-md text-sm text-[var(--color-ink-400)]">
                  Create, update, and delete tasks with natural language, or use
                  the form and task list on the right for precise control.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : message.role === "system"
                        ? "justify-center"
                        : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-ink-100)]"
                        : message.role === "system"
                          ? "border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 text-[var(--color-ink-300)]"
                          : "border border-white/10 bg-[var(--color-surface-800)]"
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-400)]">
                      {message.role === "user"
                        ? "You"
                        : message.role === "system"
                          ? "Manual action"
                          : "Assistant"}
                    </p>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.actions && message.actions.length > 0 ? (
                      <ul className="mt-3 space-y-1 border-t border-white/10 pt-2 text-xs text-[var(--color-ink-400)]">
                        {message.actions.map((action, index) => (
                          <li key={`${message.id}-action-${index}`}>
                            {action.ok ? "✓" : "✗"} {action.summary}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ))
            )}

            {sending ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-[var(--color-surface-800)] px-4 py-3 text-sm text-[var(--color-ink-400)]">
                  Running tools…
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleChatSubmit}
            className="border-t border-white/10 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="task-message">
                Message
              </label>
              <textarea
                id="task-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                placeholder="Ask to create, list, update, or delete a task…"
                disabled={sending}
                className="min-h-[52px] flex-1 resize-y rounded-xl border border-white/10 bg-[var(--color-surface-900)] px-3 py-2 text-sm outline-none ring-[var(--color-accent)] placeholder:text-[var(--color-ink-400)] focus:ring-1 disabled:opacity-60"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-surface-950)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-accent)]">
                  Manual CRUD
                </p>
                <h2 className="font-display mt-1 text-lg font-semibold">
                  {editingTask ? `Edit task #${editingTask.id}` : "Create task"}
                </h2>
              </div>
              {!editingTask ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm((value) => !value)}
                  className="text-xs text-[var(--color-ink-400)] transition hover:text-[var(--color-accent)]"
                >
                  {showCreateForm ? "Hide form" : "Show form"}
                </button>
              ) : null}
            </div>

            {editingTask ? (
              <TaskForm
                mode="edit"
                initial={editingTask}
                submitting={savingManual}
                onCancel={() => setEditingTask(null)}
                onSubmit={handleUpdate}
              />
            ) : showCreateForm ? (
              <TaskForm
                mode="create"
                submitting={savingManual}
                onSubmit={handleCreate}
              />
            ) : (
              <p className="text-sm text-[var(--color-ink-400)]">
                Form hidden. Use chat or open the create form again.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[var(--color-surface-850)]/80 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Task list</h2>
              <button
                type="button"
                onClick={() => {
                  void loadTasks();
                }}
                className="text-xs text-[var(--color-ink-400)] transition hover:text-[var(--color-accent)]"
              >
                Refresh
              </button>
            </div>

            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-[var(--color-ink-400)]">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[var(--color-surface-900)] px-2 py-1.5 text-sm"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="text-xs text-[var(--color-ink-400)]">
                Priority
                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target.value as TaskPriority | "all",
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[var(--color-surface-900)] px-2 py-1.5 text-sm"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>

            {loadingTasks ? (
              <p className="text-sm text-[var(--color-ink-400)]">Loading tasks…</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-400)]">
                No tasks match these filters. Create one manually or via chat.
              </p>
            ) : (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-xl border border-white/10 bg-[var(--color-surface-900)]/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-ink-100)]">
                          #{task.id} {task.title}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide ${priorityClass(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide ${statusClass(task.status)}`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {task.description ? (
                      <p className="mt-2 text-xs text-[var(--color-ink-400)]">
                        {task.description}
                      </p>
                    ) : null}

                    {task.dueDate ? (
                      <p className="mt-2 text-[11px] text-[var(--color-ink-400)]">
                        Due {new Date(task.dueDate).toLocaleString()}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTask(task)}
                        className="rounded-md border border-white/15 px-2.5 py-1 text-xs transition hover:border-[var(--color-accent)]/50"
                      >
                        Edit
                      </button>
                      {task.status !== "completed" ? (
                        <button
                          type="button"
                          onClick={() => {
                            void quickUpdateStatus(task, "completed");
                          }}
                          className="rounded-md border border-[var(--color-accent)]/30 px-2.5 py-1 text-xs text-[var(--color-accent)]"
                        >
                          Complete
                        </button>
                      ) : null}
                      {task.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => {
                            void quickUpdateStatus(task, "in_progress");
                          }}
                          className="rounded-md border border-sky-400/30 px-2.5 py-1 text-xs text-sky-300"
                        >
                          Start
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          void requestManualDelete(task);
                        }}
                        className="rounded-md border border-[var(--color-danger)]/30 px-2.5 py-1 text-xs text-[var(--color-danger)]"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--color-surface-900)] p-6 shadow-xl"
          >
            <h2
              id="delete-task-title"
              className="font-display text-xl font-semibold"
            >
              Confirm deletion
            </h2>
            <p className="mt-3 text-sm text-[var(--color-ink-300)]">
              Delete task #{pendingDelete.taskId}
              {pendingDelete.task?.title ? `: ${pendingDelete.task.title}` : ""}?
              This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={confirmingDelete}
                onClick={() => setPendingDelete(null)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmingDelete}
                onClick={() => {
                  void confirmDelete();
                }}
                className="rounded-lg bg-[var(--color-danger)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {confirmingDelete ? "Deleting…" : "Delete task"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
