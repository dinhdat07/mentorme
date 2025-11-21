'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Star, CheckCircle, ArrowRight, Sparkles, Target, Shield } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleGetStarted = (role: 'student' | 'tutor') => {
    if (user) {
      window.location.href = role === 'student' ? '/dashboard/student' : '/dashboard/tutor';
    } else {
      window.location.href = `/register?role=${role}`;
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gradient flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Mentor Me
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href={user.role === 'STUDENT' ? '/dashboard/student' : '/dashboard/tutor'}
                  className="text-gray-700 hover:text-gradient font-medium transition-colors duration-300"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-300">
                  Sign In
                </Link>
                <Button
                  onClick={() => handleGetStarted('student')}
                  className="btn-gradient text-white font-semibold rounded-full px-6"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10 blur-3xl rounded-full w-96 h-96 -top-40 -left-40"></div>
        <div className="absolute inset-0 bg-gradient-premium opacity-10 blur-3xl rounded-full w-96 h-96 -bottom-40 -right-40"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className={`transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-subtle px-6 py-2 rounded-full mb-6 border border-purple-200 animate-fade-in-up">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-gradient">Welcome to Mentor Me</span>
            </div>

            <h1 className="text-6xl sm:text-7xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up delay-100">
              Connect with Expert
              <span className="text-gradient block mt-2">Tutors & Teachers</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              Find the perfect tutor for your learning goals or share your expertise with students. Transform your education journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
              <button
                onClick={() => handleGetStarted('student')}
                className="btn-gradient text-white flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-2xl"
              >
                Find a Tutor <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleGetStarted('tutor')}
                className="px-8 py-4 rounded-full font-semibold text-lg border-2 border-gradient-to-r from-purple-600 to-pink-600 text-gray-900 hover:bg-gradient-subtle transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                Become a Tutor <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-in-up delay-400">
              {[
                { number: '10K+', label: 'Active Tutors' },
                { number: '50K+', label: 'Happy Students' },
                { number: '4.8★', label: 'Average Rating' },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <p className="text-4xl font-bold text-gradient">{stat.number}</p>
                  <p className="text-gray-600 mt-2 group-hover:text-gray-900 transition-colors">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-subtle relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to get started on your learning journey</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* For Students */}
            <div className={`card-hover bg-white rounded-2xl p-10 border border-gray-200 transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-premium rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Students</h3>
              </div>
              <ol className="space-y-6">
                {[
                  { title: 'Create Your Profile', desc: 'Tell us about your learning goals and preferred subjects' },
                  { title: 'Browse Tutors', desc: 'Filter by subject, price, and trust score' },
                  { title: 'Book a Class', desc: 'Try with a trial lesson first' },
                  { title: 'Learn & Review', desc: 'Get personalized lessons and share your feedback' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 group cursor-pointer">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-premium text-white rounded-full flex items-center justify-center font-bold text-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-gradient transition-colors">{item.title}</p>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* For Tutors */}
            <div className={`card-hover bg-white rounded-2xl p-10 border border-gray-200 transition-all duration-1000 transform delay-200 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-premium rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Tutors</h3>
              </div>
              <ol className="space-y-6">
                {[
                  { title: 'Apply & Verify', desc: 'Create your profile with credentials and verify your expertise' },
                  { title: 'Set Your Classes', desc: 'Create classes with your rates and teaching modes' },
                  { title: 'Accept Bookings', desc: 'Review student requests and confirm classes' },
                  { title: 'Build Your Reputation', desc: 'Earn trust scores and positive reviews' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 group cursor-pointer">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-premium text-white rounded-full flex items-center justify-center font-bold text-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-gradient transition-colors">{item.title}</p>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">Why Choose Mentor Me?</h2>
            <p className="text-xl text-gray-600">Experience the best in online education and mentorship</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Verified Tutors',
                desc: 'All tutors are verified and ranked by trust score based on student reviews',
                color: 'from-blue-600 to-purple-600',
              },
              {
                icon: Target,
                title: 'Smart Matching',
                desc: 'Our algorithm connects you with the best tutors based on your specific needs',
                color: 'from-purple-600 to-pink-600',
              },
              {
                icon: BookOpen,
                title: 'Flexible Learning',
                desc: 'Choose online or in-person sessions, and set your own schedule and pace',
                color: 'from-pink-600 to-red-600',
              },
            ].map((feature, i) => (
              <div key={i} className={`card-hover bg-white rounded-2xl p-8 border border-gray-200 group transition-all duration-1000 transform delay-${i * 100} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className={`flex items-center justify-center w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gradient transition-colors">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-premium opacity-10 blur-3xl rounded-full w-96 h-96 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-12">
            Join thousands of students and tutors already learning together on Mentor Me
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleGetStarted('student')}
              className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Find a Tutor Now
            </button>
            <button
              onClick={() => handleGetStarted('tutor')}
              className="px-8 py-4 bg-white/20 text-white rounded-full font-semibold text-lg border border-white/30 hover:bg-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm"
            >
              Start Teaching
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-white font-bold mb-4 text-gradient flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Mentor Me
              </h3>
              <p className="text-sm">Connecting students with expert tutors worldwide</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/tutors" className="hover:text-white transition-colors duration-300">
                    Browse Tutors
                  </Link>
                </li>
                {!user && (
                  <li>
                    <Link href="/register?role=student" className="hover:text-white transition-colors duration-300">
                      Sign Up
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Tutors</h4>
              <ul className="space-y-2 text-sm">
                {!user && (
                  <li>
                    <Link href="/register?role=tutor" className="hover:text-white transition-colors duration-300">
                      Become a Tutor
                    </Link>
                  </li>
                )}
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-300">
                    How It Works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-300">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-300">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 Mentor Me. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
