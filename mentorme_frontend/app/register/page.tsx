'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '@/components/auth-provider';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'TUTOR',
  });
  const googleAuthEnabled = (process.env.NEXT_PUBLIC_USE_GOOGLE_AUTH ?? 'true').toLowerCase() === 'true';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData.fullName, formData.email, formData.phone, formData.password, formData.role);
      router.push(`/dashboard/${formData.role === 'TUTOR' ? 'tutor' : 'student'}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    const url = `${apiBase}/api/auth/google?role=${formData.role}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden py-8">
      <div className="absolute inset-0 bg-gradient-premium opacity-10 blur-3xl rounded-full w-96 h-96 -top-40 -right-40"></div>
      <div className="absolute inset-0 bg-gradient-hero opacity-10 blur-3xl rounded-full w-96 h-96 -bottom-40 -left-40"></div>

      <div className="glass rounded-2xl p-12 w-full max-w-md relative z-10 border border-white/30 shadow-2xl bg-white/20 backdrop-blur-xl animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white/10 px-4 py-2 rounded-full mb-4 border border-white/30">
            <Image src="/mentorme_logo.png" alt="MentorMe logo" width={48} height={48} className="mr-2 rounded-full" />
            <span className="text-sm font-semibold text-gradient flex items-center gap-1">
              Mentor Me
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Join Our Community</h1>
          <p className="text-white/80">Start your learning or teaching journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg animate-fade-in-up">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">Full Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-3 w-5 h-5 text-purple-400/60 group-focus-within:text-purple-300 transition-colors" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-purple-400/60 group-focus-within:text-purple-300 transition-colors" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Phone</label>
            <div className="relative group">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-purple-400/60 group-focus-within:text-purple-300 transition-colors" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Password</label>
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

          <div>
            <label className="block text-sm font-medium text-white mb-2">I am a</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
            >
              <option value="STUDENT" className="bg-gray-900">Student / Parent</option>
              <option value="TUTOR" className="bg-gray-900">Tutor / Teacher</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gradient text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : (
              <>
                Create Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {googleAuthEnabled && (
          <>
            <div className="flex items-center gap-2 text-white/70 my-6">
              <div className="flex-1 h-px bg-white/30" />
              <span className="text-sm">or</span>
              <div className="flex-1 h-px bg-white/30" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white text-gray-900 font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 hover:bg-purple-50 border border-white/60"
            >
              <Mail className="w-5 h-5 text-red-500" />
              Continue with Google
            </button>
          </>
        )}

        <p className="text-center text-white/80 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-200 hover:text-purple-100 font-semibold transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
