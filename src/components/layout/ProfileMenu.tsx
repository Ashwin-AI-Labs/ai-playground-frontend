import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "../../features/auth/AuthContext";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileMenu() {
  const { user, logout, updateName } = useAuth();
  const [open, setOpen] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync name field when user changes
  useEffect(() => {
    if (user?.name) setNameValue(user.name);
  }, [user?.name]);

  // Click outside / Escape to close
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Dialog escape
  useEffect(() => {
    if (!showNameDialog) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowNameDialog(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showNameDialog]);

  if (!user) return null;

  async function handleLogout() {
    setOpen(false);
    await logout();
  }

  function openNameDialog() {
    setOpen(false);
    setNameValue(user?.name ?? "");
    setNameError(null);
    setShowNameDialog(true);
  }

  async function handleNameSave(e: FormEvent) {
    e.preventDefault();
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    setNameLoading(true);
    setNameError(null);
    try {
      await updateName(trimmed);
      setShowNameDialog(false);
    } catch {
      setNameError("Failed to update name. Please try again.");
    } finally {
      setNameLoading(false);
    }
  }

  return (
    <>
      <div className="profile-menu" ref={menuRef}>
        <button
          ref={triggerRef}
          type="button"
          className="profile-menu__trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="profile-menu__avatar" aria-hidden="true">
            {initials(user.name)}
          </span>
          <svg
            className={`profile-menu__caret ${open ? "profile-menu__caret--open" : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="sr-only">Account menu</span>
        </button>

        {open && (
          <div className="profile-menu__dropdown" role="menu">
            <div className="profile-menu__name-row">
              <p className="profile-menu__name">{user.name}</p>
              <p className="profile-menu__email">{user.email}</p>
            </div>

            <button
              type="button"
              className="profile-menu__item"
              role="menuitem"
              onClick={openNameDialog}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Change name
            </button>

            <button
              type="button"
              className="profile-menu__item profile-menu__item--danger"
              role="menuitem"
              onClick={handleLogout}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Change name dialog */}
      {showNameDialog && (
        <div
          className="auth-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-name-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNameDialog(false);
          }}
        >
          <div className="auth-dialog">
            <h2 id="change-name-title" className="auth-dialog__title">
              Change name
            </h2>
            <form onSubmit={handleNameSave}>
              <div className="auth-field">
                <label htmlFor="change-name-input" className="auth-label">
                  Full name
                </label>
                <input
                  id="change-name-input"
                  type="text"
                  className="auth-input"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  required
                  disabled={nameLoading}
                />
                {nameError ? (
                  <p className="auth-field-error">{nameError}</p>
                ) : null}
              </div>
              <div className="auth-dialog__actions">
                <button
                  type="button"
                  className="auth-btn auth-btn--secondary"
                  onClick={() => setShowNameDialog(false)}
                  disabled={nameLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="auth-btn auth-btn--primary"
                  disabled={nameLoading || !nameValue.trim()}
                >
                  {nameLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
