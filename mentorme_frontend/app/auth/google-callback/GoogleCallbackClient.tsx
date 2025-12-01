"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/api-client";

const roleToDashboard = (role: string | null) => {
  if (role === "TUTOR") return "/dashboard/tutor";
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard/student";
};

export function GoogleCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role");

    if (!token) {
      router.replace("/login?error=google-oauth");
      return;
    }

    setToken(token);
    router.replace(roleToDashboard(role));
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-center text-white">
        <p className="text-xl font-semibold">Signing you in with Google...</p>
        <p className="text-white/70 mt-2">
          Please wait while we finalize your session.
        </p>
      </div>
    </div>
  );
}
