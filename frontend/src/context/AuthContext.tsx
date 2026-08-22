"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  clearTokens,
  getAccessToken,
  getStoredUser,
  setStoredUser,
  setTokens,
} from "@/lib/api";
import type { User } from "@/lib/api/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True until the stored session has been checked on first paint. */
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Seeded from localStorage so an authenticated reload doesn't flash the
  // logged-out state; the profile is then re-fetched from /users/me.
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getAccessToken();
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      const cached = getStoredUser<User>();
      if (cached && !cancelled) setUser(cached);

      try {
        const fresh = await authApi.me();
        if (cancelled) return;
        setUser(fresh);
        setStoredUser(fresh);
      } catch {
        // The refresh interceptor already handles expiry; anything left here
        // means the session is genuinely gone.
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const adoptSession = useCallback(async (accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    const profile = await authApi.me();
    setUser(profile);
    setStoredUser(profile);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login(email, password);
      await adoptSession(tokens.access_token, tokens.refresh_token);
    },
    [adoptSession],
  );

  const register = useCallback(
    async (data: { email: string; password: string; full_name: string }) => {
      await authApi.register(data);
      const tokens = await authApi.login(data.email, data.password);
      await adoptSession(tokens.access_token, tokens.refresh_token);
    },
    [adoptSession],
  );

  const googleLogin = useCallback(
    async (idToken: string) => {
      const tokens = await authApi.google(idToken);
      await adoptSession(tokens.access_token, tokens.refresh_token);
    },
    [adoptSession],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    if (typeof window !== "undefined") window.location.href = "/login";
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authApi.me();
      setUser(fresh);
      setStoredUser(fresh);
    } catch {
      // Leave the cached profile in place — a failed refresh isn't a logout.
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      register,
      googleLogin,
      logout,
      refreshUser,
    }),
    [user, isBootstrapping, login, register, googleLogin, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
