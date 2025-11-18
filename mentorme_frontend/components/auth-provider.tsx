'use client';

import { ReactNode, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, StudentProfile, TutorProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  studentProfile: StudentProfile | null;
  tutorProfile: TutorProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (fullName: string, email: string, phone: string, password: string, role: 'STUDENT' | 'TUTOR') => Promise<any>;
  login: (emailOrPhone: string, password: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
