import { useEffect, useState, type FormEvent } from "react";
import type { Task, TaskPriority, TaskStatus } from "../types";

export type TaskFormValues = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
};

type TaskFormProps = {
  mode: "create" | "edit";
  initial?: Task | null;
  submitting: boolean;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

const emptyValues: TaskFormValues = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  dueDate: "",
};

export function TaskForm({
  mode,
  initial,
  submitting,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(emptyValues);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && initial) {
      setValues({
        title: initial.title,
        description: initial.description ?? "",
        priority: initial.priority,
        status: initial.status,
        dueDate: toLocalInputValue(initial.dueDate),
      });
    } else if (mode === "create") {
      setValues(emptyValues);
    }
  }, [mode, initial]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.title.trim()) {
      setLocalError("Title is required.");
      return;
    }
    setLocalError(null);
    await onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
    });
    if (mode === "create") {
      setValues(emptyValues);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-white/10 bg-[var(--color-surface-900)] px-3 py-2 text-sm outline-none ring-[var(--color-accent)] placeholder:text-[var(--color-ink-400)] focus:ring-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-[var(--color-ink-400)]" htmlFor={`task-title-${mode}`}>
          Title
        </label>
        <input
          id={`task-title-${mode}`}
          value={values.title}
          onChange={(event) =>
            setValues((current) => ({ ...current, title: event.target.value }))
          }
          className={fieldClass}
          placeholder="Task title"
          disabled={submitting}
          required
        />
      </div>

      <div>
        <label
          className="mb-1 block text-xs text-[var(--color-ink-400)]"
          htmlFor={`task-description-${mode}`}
        >
          Description
        </label>
        <textarea
          id={`task-description-${mode}`}
          value={values.description}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          rows={3}
          className={fieldClass}
          placeholder="Optional details"
          disabled={submitting}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-xs text-[var(--color-ink-400)]"
            htmlFor={`task-priority-${mode}`}
          >
            Priority
          </label>
          <select
            id={`task-priority-${mode}`}
            value={values.priority}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                priority: event.target.value as TaskPriority,
              }))
            }
            className={fieldClass}
            disabled={submitting}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label
            className="mb-1 block text-xs text-[var(--color-ink-400)]"
            htmlFor={`task-status-${mode}`}
          >
            Status
          </label>
          <select
            id={`task-status-${mode}`}
            value={values.status}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                status: event.target.value as TaskStatus,
              }))
            }
            className={fieldClass}
            disabled={submitting}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div>
        <label
          className="mb-1 block text-xs text-[var(--color-ink-400)]"
          htmlFor={`task-due-${mode}`}
        >
          Due date
        </label>
        <input
          id={`task-due-${mode}`}
          type="datetime-local"
          value={values.dueDate}
          onChange={(event) =>
            setValues((current) => ({ ...current, dueDate: event.target.value }))
          }
          className={fieldClass}
          disabled={submitting}
        />
      </div>

      {localError ? (
        <p className="text-sm text-[var(--color-danger)]">{localError}</p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-surface-950)] disabled:opacity-50"
        >
          {submitting
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create task"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
