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
      <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <SidebarNav />
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
          <div className="backdrop-blur-3xl">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
};
