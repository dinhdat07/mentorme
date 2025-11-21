"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/components/auth-provider";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login(formData.emailOrPhone, formData.password);
      const role = response.user.role;
      router.push(
        `/dashboard/${
          role === "TUTOR" ? "tutor" : role === "ADMIN" ? "admin" : "student"
        }`
      );
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-premium opacity-10 blur-3xl rounded-full w-96 h-96 -top-40 -left-40"></div>
      <div className="absolute inset-0 bg-gradient-hero opacity-10 blur-3xl rounded-full w-96 h-96 -bottom-40 -right-40"></div>

      <div className="glass rounded-2xl p-12 w-full max-w-md relative z-10 border border-white/30 shadow-2xl bg-white/20 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-subtle px-4 py-2 rounded-full mb-4 border border-purple-200">
            <img
              src="/logo.png" // đường dẫn tới ảnh trong /public
              alt="MentorMe Logo"
              width={24} // chiều rộng logo
              height={24} // chiều cao logo
              className="rounded-full"
            />
            <span className="text-sm font-semibold text-gradient">
              Mentor Me
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/80">Sign in to your learning account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg animate-fade-in-up">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email or Phone
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-purple-400/60 group-focus-within:text-purple-300 transition-colors" />
              <input
                type="text"
                name="emailOrPhone"
                value={formData.emailOrPhone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-purple-400/60 group-focus-within:text-purple-300 transition-colors" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gradient text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              "Signing in..."
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-white/80 mt-8">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-purple-200 hover:text-purple-100 font-semibold transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
