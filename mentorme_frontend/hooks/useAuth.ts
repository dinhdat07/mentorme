'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, getToken, setToken, clearToken } from '@/lib/api-client';
import { User, StudentProfile, TutorProfile, AuthResponse } from '@/lib/types';

export interface AuthState {
  user: User | null;
  studentProfile: StudentProfile | null;
  tutorProfile: TutorProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    studentProfile: null,
    tutorProfile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load auth from localStorage on mount and whenever token changes
  useEffect(() => {
    let cancelled = false;

    const loadAuth = async () => {
      if (cancelled) return;
      const token = getToken();

      if (!token) {
        setState({
          user: null,
          studentProfile: null,
          tutorProfile: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await apiClient.get<AuthResponse>('/api/auth/me');
        if (cancelled) return;
        setState({
          user: response.user,
          studentProfile: response.studentProfile || null,
          tutorProfile: response.tutorProfile || null,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        if (cancelled) return;
        clearToken();
        setState({
          user: null,
          studentProfile: null,
          tutorProfile: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    loadAuth();

    const handleTokenChange = () => {
      loadAuth();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('accessToken-changed', handleTokenChange);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('accessToken-changed', handleTokenChange);
      }
    };
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, phone: string, password: string, role: 'STUDENT' | 'TUTOR') => {
      try {
        const response = await apiClient.post<AuthResponse>('/api/auth/register', {
          fullName,
          email,
          phone,
          password,
          role,
        });
        setToken(response.accessToken);
        setState({
          user: response.user,
          studentProfile: response.studentProfile || null,
          tutorProfile: response.tutorProfile || null,
          isLoading: false,
          isAuthenticated: true,
        });
        return response;
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const login = useCallback(async (emailOrPhone: string, password: string) => {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', {
        emailOrPhone,
        password,
      });
      setToken(response.accessToken);
      setState({
        user: response.user,
        studentProfile: response.studentProfile || null,
        tutorProfile: response.tutorProfile || null,
        isLoading: false,
        isAuthenticated: true,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({
      user: null,
      studentProfile: null,
      tutorProfile: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  return {
    ...state,
    register,
    login,
    logout,
  };
};
