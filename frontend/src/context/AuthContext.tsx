"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, TokenResponse } from "@/types/auth";
import { api, getAccessToken, setTokens, clearTokens } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (formData: FormData) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<string>;
  verifyOTP: (email: string, otp: string) => Promise<string>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const savedToken = getAccessToken();
      const savedUserStr = localStorage.getItem("supportai_user");
      if (savedToken && savedUserStr) {
        setToken(savedToken);
        setUser(JSON.parse(savedUserStr));
      }
    } catch (err) {
      console.warn("Failed to restore auth session:", err);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (formData: FormData) => {
    setIsLoading(true);
    try {
      // Backend expects OAuth2 form data for /auth/login
      const response = await api.post<TokenResponse>("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token);
      setToken(access_token);

      // Create basic user from email or fetch profile
      const username = formData.get("username") as string;
      const loggedUser: User = {
        id: "",
        email: username,
        full_name: username.split("@")[0],
        is_active: true,
      };
      setUser(loggedUser);
      localStorage.setItem("supportai_user", JSON.stringify(loggedUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; full_name: string }) => {
    setIsLoading(true);
    try {
      await api.post<User>("/auth/register", data);
      // Automatically log in after registration
      const loginData = new FormData();
      loginData.append("username", data.email);
      loginData.append("password", data.password);
      await login(loginData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const res = await api.post<{ message: string }>("/auth/forgot-password", { email });
    return res.data.message;
  };

  const verifyOTP = async (email: string, otp: string): Promise<string> => {
    const res = await api.post<{ reset_token: string }>("/auth/verify-forgot-password-otp", {
      email,
      otp,
    });
    return res.data.reset_token;
  };

  const resetPassword = async (resetToken: string, newPassword: string): Promise<string> => {
    const res = await api.post<{ message: string }>("/auth/reset-password", {
      reset_token: resetToken,
      new_password: newPassword,
    });
    return res.data.message;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        verifyOTP,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
