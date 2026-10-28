import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../../services/api/client";
import { useAuth, type Gender } from "../AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordField } from "../components/PasswordField";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "prefer_not_to_say", label: "Prefer not to say" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "other", label: "Other" },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await register({
        name,
        email,
        password,
        ...(gender ? { gender } : {}),
      });
      navigate("/verify-email", {
        state: { email, resendAvailableAt: result.resendAvailableAt },
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      panelTitle="Create your AI Playground account."
      panelBody="Register once, verify your email, and unlock six intelligent capabilities with history that stays private to you."
    >
      <div className="auth-card">
        <div className="auth-card__head">
          <p className="auth-card__eyebrow">Get started</p>
          <h1 className="auth-card__title">Create account</h1>
          <p className="auth-card__subtitle">
            A few details now — then we&apos;ll send a verification code to your
            email.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}

          <div className="auth-field">
            <label htmlFor="reg-name" className="auth-label">
              Full name
            </label>
            <input
              id="reg-name"
              type="text"
              className="auth-input"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-gender" className="auth-label">
              Gender{" "}
              <span className="auth-label-optional">(optional)</span>
            </label>
            <select
              id="reg-gender"
              className="auth-select"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | "")}
              disabled={loading}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">
              Email address
            </label>
            <input
              id="reg-email"
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
            id="reg-password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            autoComplete="new-password"
          />
          <p className="auth-hint">
            At least 8 characters, including one letter and one number.
          </p>

          <button
            type="submit"
            className="auth-btn auth-btn--primary"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-card__footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
