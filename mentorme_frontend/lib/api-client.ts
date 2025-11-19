/**
 * API Client with automatic Bearer token attachment
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
};

const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
};

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API Error');
  }

  return data;
}

export const apiClient = {
  get: <T,>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'GET' }),
  
  post: <T,>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  
  patch: <T,>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  
  delete: <T,>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'DELETE' }),
};

export { getToken, setToken, clearToken };
