import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { VerifyEmailPage } from "../features/auth/pages/VerifyEmailPage";
import { ChatAssistantPage } from "../features/chat-assistant";
import { DocumentSummarizerPage } from "../features/document-summarizer";
import { PdfRagPage } from "../features/pdf-rag";
import { ResearchAgentPage } from "../features/research-agent";
import { SemanticSearchPage } from "../features/semantic-search";
import { TaskAssistantPage } from "../features/task-assistant";
import { DashboardPage } from "../pages/DashboardPage";
import { FeaturePlaceholderPage } from "../pages/FeaturePlaceholderPage";
import { NotFoundPage } from "../pages/NotFoundPage";

/**
 * Requires authentication. Redirects to /login with location state if not
 * authenticated. Shows nothing while the bootstrap check is in flight.
 */
function AuthBootScreen() {
  return (
    <div className="auth-boot" role="status" aria-live="polite">
      <div className="auth-boot__card">
        <p className="auth-boot__title">AI Playground</p>
        <p className="auth-boot__copy">Checking your session…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return <AuthBootScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Redirects already-authenticated users away from auth pages.
 */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <AuthBootScreen />;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

/**
 * Central route table. Implemented features register pages here;
 * unimplemented ones fall through to FeaturePlaceholderPage via :featureId.
 */
function RootRedirect() {
  const { user, bootstrapping } = useAuth();
  if (bootstrapping) return <AuthBootScreen />;
  return <Navigate to={user ? "/home" : "/login"} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Root: signed-in users → home, guests → login */}
      <Route path="/" element={<RootRedirect />} />

      {/* Home and features require authentication */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Auth routes — redirect to /home if already signed in */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      {/* Verify-email is public (user has no session yet) */}
      <Route
        path="/verify-email"
        element={
          <PublicOnlyRoute>
            <VerifyEmailPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected feature routes */}
      <Route
        path="/features/chat-assistant"
        element={
          <ProtectedRoute>
            <ChatAssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features/task-assistant"
        element={
          <ProtectedRoute>
            <TaskAssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features/semantic-search"
        element={
          <ProtectedRoute>
            <SemanticSearchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features/pdf-qa"
        element={
          <ProtectedRoute>
            <PdfRagPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features/summarizer"
        element={
          <ProtectedRoute>
            <DocumentSummarizerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features/research-agent"
        element={
          <ProtectedRoute>
            <ResearchAgentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/features/:featureId"
        element={
          <ProtectedRoute>
            <FeaturePlaceholderPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
