'use client';

import { SidebarNav } from './sidebar-nav';
import { ProtectedRoute } from './protected-route';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

export const DashboardLayout = ({ children, requiredRole }: DashboardLayoutProps) => {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className="flex h-screen bg-gray-50">
        <SidebarNav />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
};
