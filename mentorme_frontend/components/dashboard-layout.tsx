'use client';

import { SidebarNav } from './sidebar-nav';
import { ProtectedRoute } from './protected-route';
import { useUISettings } from './ui-settings-context';

type ThemeMode = 'dark' | 'light';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: string[];
  theme?: ThemeMode;
}

export const DashboardLayout = ({ children, requiredRole, theme }: DashboardLayoutProps) => {
  const { theme: ctxTheme } = useUISettings();
  const activeTheme = theme || ctxTheme;
  const isDark = activeTheme === 'dark';
  const outerBg = isDark
    ? 'from-slate-950 via-slate-900 to-slate-950'
    : 'from-slate-50 via-white to-slate-100';
  const mainBg = isDark
    ? 'from-slate-900 via-purple-900/10 to-slate-900'
    : 'from-white via-purple-50/40 to-slate-50';

  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <div className={`flex h-screen bg-gradient-to-br ${outerBg} transition-colors duration-300`}>
        <SidebarNav theme={activeTheme} />
        <main className={`flex-1 overflow-auto bg-gradient-to-br ${mainBg} transition-colors duration-300`}>
          <div className="backdrop-blur-3xl">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
};
