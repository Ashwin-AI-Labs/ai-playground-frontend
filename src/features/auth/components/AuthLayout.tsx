import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../../../components/brand/BrandMark";

type AuthLayoutProps = {
  children: ReactNode;
  /** Short panel title for the decorative side */
  panelTitle?: string;
  panelBody?: string;
};

const DEFAULT_TITLE = "One workspace. Six intelligent AI capabilities.";
const DEFAULT_BODY =
  "Chat, tasks, semantic search, PDF Q&A, summarization, and research — secured for your account.";

export function AuthLayout({
  children,
  panelTitle = DEFAULT_TITLE,
  panelBody = DEFAULT_BODY,
}: AuthLayoutProps) {
  const year = new Date().getFullYear();

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="auth-shell auth-header__inner">
          <Link to="/login" className="auth-brand" aria-label="AI Playground">
            <BrandMark />
            <span className="auth-brand__text">
              <span className="auth-brand__name">AI Playground</span>
              <span className="auth-brand__tagline">
                One workspace. Six intelligent AI capabilities.
              </span>
            </span>
          </Link>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-shell auth-stage">
          <aside className="auth-panel" aria-hidden="true">
            <div className="auth-panel__glow" />
            <p className="auth-panel__eyebrow">AI Playground</p>
            <h2 className="auth-panel__title">{panelTitle}</h2>
            <p className="auth-panel__body">{panelBody}</p>
            <ul className="auth-panel__list">
              <li>Private history per account</li>
              <li>Secure email verification</li>
              <li>Six AI capabilities in one place</li>
            </ul>
          </aside>

          <div className="auth-stage__form">{children}</div>
        </div>
      </main>

      <footer className="auth-footer">
        <div className="auth-shell auth-footer__inner">
          <p>© {year} AI Playground</p>
          <p className="auth-footer__note">Crafted with care in Mayiladuthurai</p>
        </div>
      </footer>
    </div>
  );
}
