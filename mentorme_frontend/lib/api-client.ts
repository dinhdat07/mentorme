/**
 * API Client with automatic Bearer token attachment
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};

const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", token);
    // Notify listeners (same tab) that auth token changed
    window.dispatchEvent(new Event("accessToken-changed"));
  }
};

const clearToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("accessToken-changed"));
  }
};

export class ApiError<T = any> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Clear token and redirect on auth failure
    if (response.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    let message = (data && data.message) || `API Error (${response.status})`;
    if (response.status === 401) {
      message = data?.message || "Bạn chưa đăng nhập hoặc phiên đã hết hạn";
    } else if (response.status === 403) {
      message =
        data?.message || "Bạn chưa được phê duyệt để thực hiện hành động này";
    } else if (response.status === 400) {
      message = data?.message || "Yêu cầu không hợp lệ";
    }
    throw new ApiError(message, response.status, data || undefined);
  }

  return data;
}

export const apiClient = {
  get: <T>(endpoint: string) => apiCall<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) => apiCall<T>(endpoint, { method: "DELETE" }),
};

export { getToken, setToken, clearToken };
