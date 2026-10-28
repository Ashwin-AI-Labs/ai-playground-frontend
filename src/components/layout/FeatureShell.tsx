import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { BrandMark } from "../brand/BrandMark";
import { ProfileMenu } from "./ProfileMenu";

type FeatureShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Wider content for chat-like two-column layouts */
  wide?: boolean;
  children: ReactNode;
};

/**
 * Shared light-theme chrome for all feature pages.
 * Preserves page-owned business logic inside `children`.
 */
export function FeatureShell({
  title,
  description,
  actions,
  wide = false,
  children,
}: FeatureShellProps) {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <div className="feature-app">
      <a href="#feature-main" className="feature-app__skip">
        Skip to content
      </a>

      <header className="feature-app__header">
        <div className="feature-app__shell feature-app__header-inner">
          <Link to="/home" className="feature-app__brand" aria-label="AI Playground home">
            <BrandMark />
            <span className="feature-app__brand-text">
              <span className="feature-app__brand-name">AI Playground</span>
              <span className="feature-app__brand-tagline">
                One workspace. Six intelligent AI capabilities.
              </span>
            </span>
          </Link>

          {user && (
            <div className="feature-app__nav-right">
              <ProfileMenu />
            </div>
          )}
        </div>
      </header>

      <main
        id="feature-main"
        className={`feature-app__shell feature-app__main ${
          wide ? "feature-app__main--wide" : ""
        }`}
      >
        <nav className="feature-app__breadcrumb" aria-label="Breadcrumb">
          <Link to="/home" className="feature-app__breadcrumb-link">
            AI Playground
          </Link>
          <span className="feature-app__breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="feature-app__breadcrumb-current">{title}</span>
        </nav>

        <div className="feature-app__page-head">
          <div className="feature-app__page-copy">
            <h1 className="feature-app__title">{title}</h1>
            {description ? (
              <p className="feature-app__description">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="feature-app__actions">{actions}</div>
          ) : null}
        </div>

        <div className="feature-app__body">{children}</div>
      </main>

      <footer className="feature-app__footer">
        <div className="feature-app__shell">
          <div className="feature-app__footer-top">
            <div className="feature-app__footer-brand">
              <BrandMark className="h-8 w-8" />
              <div>
                <p className="feature-app__footer-name">AI Playground</p>
                <p className="feature-app__footer-copy">
                  An AI workspace for conversation, automation, knowledge
                  retrieval, and research.
                </p>
              </div>
            </div>

            <div className="feature-app__footer-credit">
              <p className="feature-app__footer-credit-label">Developed by</p>
              <p className="feature-app__footer-credit-name">Ashwin</p>
              <a
                className="feature-app__footer-credit-email"
                href="mailto:ashwindevcode@gmail.com"
              >
                ashwindevcode@gmail.com
              </a>
              <p className="feature-app__footer-credit-place">Mayiladuthurai</p>
            </div>
          </div>

          <div className="feature-app__footer-bottom">
            <p className="feature-app__footer-year">© {year} AI Playground</p>
            <p className="feature-app__footer-signature">
              Crafted with care in Mayiladuthurai
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
