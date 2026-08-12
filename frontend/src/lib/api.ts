import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper functions for token storage
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("supportai_access_token");
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("supportai_refresh_token");
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("supportai_access_token", accessToken);
  localStorage.setItem("supportai_refresh_token", refreshToken);
};

export const clearTokens = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("supportai_access_token");
  localStorage.removeItem("supportai_refresh_token");
  localStorage.removeItem("supportai_user");
};

// Request Interceptor: Attach Bearer token to all outgoing requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatically refresh expired token on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();

      // If no refresh token or request is to auth endpoints, fail immediately
      if (!refreshToken || originalRequest.url?.includes("/auth/")) {
        clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        setTokens(access_token, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearTokens();
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login?expired=1";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
