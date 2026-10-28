import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { ProfileMenu } from "../components/layout/ProfileMenu";
import { LandingCapabilityCard } from "./landing/LandingCapabilityCard";
import { BrandMark } from "./landing/LandingIcons";
import { landingCapabilities } from "./landing/landingCapabilities";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose a capability",
    body: "Start with the AI tool that fits your task.",
  },
  {
    step: "02",
    title: "Provide your input",
    body: "Ask a question, manage a task, upload a document, or explore a research topic.",
  },
  {
    step: "03",
    title: "Explore the results",
    body: "Review the generated response, retrieved information, summary, or research report.",
  },
] as const;

const HERO_CAPABILITIES = [
  "Chat",
  "Tasks",
  "Search",
  "PDF Q&A",
  "Summarize",
  "Research",
] as const;

function scrollToCapabilities() {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const target = document.getElementById("capabilities");
  if (!target) return;

  const header = document.querySelector(".landing-nav");
  const headerOffset =
    header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
  const top =
    window.scrollY + target.getBoundingClientRect().top - headerOffset - 12;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReduced ? "auto" : "smooth",
  });
}

export function DashboardPage() {
  const { user } = useAuth();
  const goToCapabilities = useCallback(() => {
    scrollToCapabilities();
  }, []);

  const year = new Date().getFullYear();

  return (
    <div className="landing-page">
      <a href="#capabilities" className="landing-skip">
        Skip to capabilities
      </a>

      <header className="landing-nav">
        <div className="landing-shell landing-nav__inner">
          <Link to="/home" className="landing-brand" aria-label="AI Playground home">
            <BrandMark />
            <span className="landing-brand__text">
              <span className="landing-brand__name">AI Playground</span>
              <span className="landing-brand__tagline">
                One workspace. Six intelligent AI capabilities.
              </span>
            </span>
          </Link>

          <nav className="landing-nav__links" aria-label="Primary">
            <button
              type="button"
              className="landing-nav__link"
              onClick={goToCapabilities}
            >
              Explore capabilities
            </button>

            {user ? (
              <ProfileMenu />
            ) : (
              <div className="landing-nav__auth-links">
                <Link to="/login" className="landing-nav__auth-link">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="landing-nav__auth-link landing-nav__auth-link--primary"
                >
                  Create account
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section
          className="landing-hero"
          aria-labelledby="landing-hero-heading"
        >
          <div className="landing-shell landing-hero__layout">
            <div className="landing-hero__copy">
              <p className="landing-hero__brand">AI Playground</p>
              <h1 id="landing-hero-heading" className="landing-hero__title">
                Build smarter{" "}
                <span className="landing-hero__title-accent">with AI.</span>
              </h1>
              <p className="landing-hero__support">
                Explore intelligent conversations, task automation, semantic
                search, document Q&amp;A, summarization, and research — all in
                one workspace.
              </p>
              <div className="landing-hero__actions">
                <button
                  type="button"
                  className="landing-btn landing-btn--primary"
                  onClick={goToCapabilities}
                >
                  Explore capabilities
                </button>
              </div>
            </div>

            <div className="landing-hero__visual" aria-hidden="true">
              <div className="landing-hero__orbit" />
              <div className="landing-hero__panel">
                <div className="landing-hero__panel-head">
                  <span className="landing-hero__badge">6 capabilities</span>
                  <span className="landing-hero__panel-title">
                    Connected workspace
                  </span>
                </div>
                <ul className="landing-hero__nodes">
                  {HERO_CAPABILITIES.map((label) => (
                    <li key={label} className="landing-hero__node">
                      <span className="landing-hero__node-dot" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          id="capabilities"
          className="landing-section"
          aria-labelledby="capabilities-heading"
        >
          <div className="landing-shell">
            <div className="landing-section__intro">
              <p className="landing-eyebrow">Explore the workspace</p>
              <h2 id="capabilities-heading" className="landing-section__title">
                Everything you need to work smarter.
              </h2>
              <p className="landing-section__support">
                Six focused AI capabilities, connected through one shared
                application.
              </p>
            </div>

            <div className="landing-grid">
              {landingCapabilities.map((capability) => (
                <LandingCapabilityCard
                  key={capability.id}
                  capability={capability}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="landing-section landing-section--muted"
          aria-labelledby="how-it-works-heading"
        >
          <div className="landing-shell">
            <div className="landing-section__intro">
              <p className="landing-eyebrow">How it works</p>
              <h2 id="how-it-works-heading" className="landing-section__title">
                A simple path from intent to insight.
              </h2>
            </div>

            <ol className="landing-steps">
              {HOW_IT_WORKS.map((item) => (
                <li key={item.step} className="landing-step">
                  <span className="landing-step__number">{item.step}</span>
                  <h3 className="landing-step__title">{item.title}</h3>
                  <p className="landing-step__body">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="landing-closing"
          aria-labelledby="closing-heading"
        >
          <div className="landing-shell landing-closing__inner">
            <h2 id="closing-heading" className="landing-closing__title">
              Ready to explore what AI can do?
            </h2>
            <p className="landing-closing__support">
              Choose a capability and start exploring the workspace.
            </p>
            <button
              type="button"
              className="landing-btn landing-btn--primary"
              onClick={goToCapabilities}
            >
              Explore all capabilities
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell">
          <div className="landing-footer__top">
            <div className="landing-footer__brand">
              <BrandMark className="h-8 w-8" />
              <div>
                <p className="landing-footer__name">AI Playground</p>
                <p className="landing-footer__copy">
                  An AI workspace for conversation, automation, knowledge
                  retrieval, and research.
                </p>
              </div>
            </div>

            <div className="landing-footer__credit">
              <p className="landing-footer__credit-label">Developed by</p>
              <p className="landing-footer__credit-name">Ashwin</p>
              <a
                className="landing-footer__credit-email"
                href="mailto:ashwindevcode@gmail.com"
              >
                ashwindevcode@gmail.com
              </a>
              <p className="landing-footer__credit-place">Mayiladuthurai</p>
            </div>
          </div>

          <div className="landing-footer__bottom">
            <p className="landing-footer__year">© {year} AI Playground</p>
            <p className="landing-footer__signature">
              Crafted with care in Mayiladuthurai
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
