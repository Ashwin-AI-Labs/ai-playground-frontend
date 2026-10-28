import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../../services/api/client";
import { useAuth } from "../AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordField } from "../components/PasswordField";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      panelTitle="Welcome back to your AI workspace."
      panelBody="Sign in to continue conversations, manage tasks, search documents, and run research — all under your private account."
    >
      <div className="auth-card">
        <div className="auth-card__head">
          <p className="auth-card__eyebrow">Account access</p>
          <h1 className="auth-card__title">Sign in</h1>
          <p className="auth-card__subtitle">
            Use your verified email and password to enter AI Playground.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}

          <div className="auth-field">
            <label htmlFor="login-email" className="auth-label">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <button
            type="submit"
            className="auth-btn auth-btn--primary"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-card__footer-text">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="auth-link">
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
