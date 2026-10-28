import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { setAuthFailureHandler } from "../../services/api/client";
import { authApi } from "./api/authApi";
import { getAccessToken, setAccessToken } from "./tokenStore";
import type { Gender, RegisterPayload, User } from "./types";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  bootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<{ resendAvailableAt: string }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokenState, setTokenState] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const navigate = useNavigate();
  const didBootstrap = useRef(false);

  // Sync module-level token with React state
  const applyToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setTokenState(token);
  }, []);

  const clearAuth = useCallback(() => {
    applyToken(null);
    setUser(null);
  }, [applyToken]);

  // Wire the global auth failure handler once
  useEffect(() => {
    setAuthFailureHandler(() => {
      clearAuth();
      navigate("/login", { replace: true });
    });
  }, [clearAuth, navigate]);

  // Bootstrap: try silent refresh on mount
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    authApi
      .refresh()
      .then((data) => {
        applyToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setBootstrapping(false);
      });
  }, [applyToken, clearAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password });
      applyToken(data.accessToken);
      setUser(data.user);
    },
    [applyToken],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<{ resendAvailableAt: string }> => {
      const data = await authApi.register(payload);
      return { resendAvailableAt: data.resendAvailableAt };
    },
    [],
  );

  const verifyEmail = useCallback(
    async (email: string, otp: string) => {
      const data = await authApi.verifyEmail({ email, otp });
      applyToken(data.accessToken);
      setUser(data.user);
    },
    [applyToken],
  );

  const resendOtp = useCallback(async (email: string) => {
    await authApi.resendOtp({ email });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    clearAuth();
    navigate("/login", { replace: true });
  }, [clearAuth, navigate]);

  const updateName = useCallback(async (name: string) => {
    const data = await authApi.updateMe({ name });
    setUser(data.user);
  }, []);

  const refreshSession = useCallback(async () => {
    const data = await authApi.refresh();
    applyToken(data.accessToken);
    setUser(data.user);
  }, [applyToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: tokenState ?? getAccessToken(),
        bootstrapping,
        login,
        register,
        verifyEmail,
        resendOtp,
        logout,
        updateName,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Re-export Gender for convenience in forms
export type { Gender };
