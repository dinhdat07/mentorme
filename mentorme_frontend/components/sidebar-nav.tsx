"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "./auth-provider";
import {
  LogOut,
  LayoutDashboard,
  Users,
  BookOpen,
  Star,
  Settings,
} from "lucide-react";

export const SidebarNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthContext();

  const getNavItems = () => {
    if (!user) return [];

    if (user.role === "STUDENT") {
      return [
        {
          label: "Dashboard",
          href: "/dashboard/student",
          icon: LayoutDashboard,
        },
        { label: "Find Tutors", href: "/tutors", icon: Users },
        {
          label: "My Bookings",
          href: "/dashboard/student/bookings",
          icon: BookOpen,
        },
        {
          label: "Profile",
          href: "/dashboard/student/profile",
          icon: Settings,
        },
      ];
    }

    if (user.role === "TUTOR") {
      return [
        { label: "Dashboard", href: "/dashboard/tutor", icon: LayoutDashboard },
        {
          label: "My Classes",
          href: "/dashboard/tutor/classes",
          icon: BookOpen,
        },
        { label: "Bookings", href: "/dashboard/tutor/bookings", icon: Users },
        { label: "Profile", href: "/dashboard/tutor/profile", icon: Settings },
        { label: "Reviews", href: "/dashboard/tutor/reviews", icon: Star },
      ];
    }

    if (user.role === "ADMIN") {
      return [
        { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      ];
    }

    return [];
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 h-screen flex flex-col border-r border-slate-700/50 shadow-2xl">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 rounded-lg flex items-center justify-center">
            <img
              src="/logo.png"
              alt="MentorMe Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Mentor Me
          </h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {getNavItems().map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition duration-300 group ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-6 bg-white rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50 space-y-3">
        <div className="p-3 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600/50 backdrop-blur-sm">
          <p className="text-sm font-medium text-slate-200">{user?.fullName}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 rounded-lg font-medium transition duration-300 border border-red-500/30 hover:border-red-500/50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};
