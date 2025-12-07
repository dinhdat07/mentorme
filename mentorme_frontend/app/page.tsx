'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Star, CheckCircle, ArrowRight, Target, Shield, Sun, Moon, Sparkles } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

type Language = 'vi' | 'en';

const translations: Record<Language, Record<string, string>> = {
  vi: {
    welcome: 'Chào mừng tới Mentor Me',
    heroTitle1: 'Kết nối với',
    heroTitle2: 'Gia sư & Giáo viên',
    heroDesc: 'Tìm gia sư phù hợp với mục tiêu học tập của bạn hoặc chia sẻ chuyên môn của bạn với học viên. Bắt đầu hành trình giáo dục của bạn ngay hôm nay.',
    btnFindTutor: 'Tìm gia sư',
    btnBecomeTutor: 'Trở thành gia sư',
    statsTutors: 'Gia sư hoạt động',
    statsStudents: 'Học viên hài lòng',
    statsRating: 'Điểm đánh giá trung bình',
    howItWorks: 'Cách hoạt động',
    howDesc: 'Các bước đơn giản để bắt đầu hành trình học tập',
    hiwStudent1: 'Tạo hồ sơ',
    hiwStudent1Desc: 'Cho chúng tôi biết mục tiêu và môn học bạn muốn',
    hiwStudent2: 'Tìm kiếm gia sư',
    hiwStudent2Desc: 'Lọc theo môn, giá và điểm tin cậy',
    hiwStudent3: 'Đặt lịch',
    hiwStudent3Desc: 'Thử lớp học thử trước',
    hiwStudent4: 'Học & đánh giá',
    hiwStudent4Desc: 'Nhận bài học cá nhân hóa và phản hồi',
    hiwTutor1: 'Đăng ký & xác minh',
    hiwTutor1Desc: 'Tạo hồ sơ và xác thực chuyên môn',
    hiwTutor2: 'Tạo lớp học',
    hiwTutor2Desc: 'Tùy chỉnh giá và hình thức dạy',
    hiwTutor3: 'Nhận đặt lịch',
    hiwTutor3Desc: 'Xem yêu cầu và xác nhận',
    hiwTutor4: 'Xây dựng uy tín',
    hiwTutor4Desc: 'Tăng điểm tin cậy và đánh giá tốt',
    whyChoose: 'Vì sao chọn Mentor Me?',
    whyDesc: 'Trải nghiệm giáo dục và cố vấn trực tuyến tốt nhất',
    verifiedTutors: 'Gia sư xác thực',
    verifiedTutorsDesc: 'Tất cả gia sư đều được xác minh và xếp hạng bằng điểm tin cậy',
    smartMatching: 'Gợi ý thông minh',
    smartMatchingDesc: 'Thuật toán kết nối bạn với gia sư phù hợp nhất',
    flexibleLearning: 'Học linh hoạt',
    flexibleLearningDesc: 'Chọn online hoặc offline, sắp xếp thời gian của bạn',
    ctaTitle: 'Sẵn sàng bắt đầu?',
    ctaDesc: 'Tham gia hàng nghìn học viên và gia sư đang học cùng Mentor Me',
    ctaFind: 'Tìm gia sư ngay',
    ctaTeach: 'Bắt đầu dạy',
    navDashboard: 'Bảng điều khiển',
    navSignIn: 'Đăng nhập',
    navGetStarted: 'Bắt đầu',
    footerForStudents: 'Dành cho học viên',
    footerBrowse: 'Duyệt gia sư',
    footerSignupStudent: 'Đăng ký',
    footerForTutors: 'Dành cho gia sư',
    footerBecomeTutor: 'Trở thành gia sư',
    footerHowItWorks: 'Cách hoạt động',
    footerSupport: 'Hỗ trợ',
    footerContact: 'Liên hệ',
    footerPrivacy: 'Chính sách bảo mật',
    recentLabel: 'Chứng chỉ',
  },
  en: {
    welcome: 'Welcome to Mentor Me',
    heroTitle1: 'Connect with Expert',
    heroTitle2: 'Tutors & Teachers',
    heroDesc: 'Find the perfect tutor for your learning goals or share your expertise with students. Transform your education journey today.',
    btnFindTutor: 'Find a Tutor',
    btnBecomeTutor: 'Become a Tutor',
    statsTutors: 'Active Tutors',
    statsStudents: 'Happy Students',
    statsRating: 'Average Rating',
    howItWorks: 'How It Works',
    howDesc: 'Simple steps to get started on your learning journey',
    hiwStudent1: 'Create Your Profile',
    hiwStudent1Desc: 'Tell us about your learning goals and preferred subjects',
    hiwStudent2: 'Browse Tutors',
    hiwStudent2Desc: 'Filter by subject, price, and trust score',
    hiwStudent3: 'Book a Class',
    hiwStudent3Desc: 'Try with a trial lesson first',
    hiwStudent4: 'Learn & Review',
    hiwStudent4Desc: 'Get personalized lessons and share your feedback',
    hiwTutor1: 'Apply & Verify',
    hiwTutor1Desc: 'Create your profile with credentials and verify your expertise',
    hiwTutor2: 'Set Your Classes',
    hiwTutor2Desc: 'Create classes with your rates and teaching modes',
    hiwTutor3: 'Accept Bookings',
    hiwTutor3Desc: 'Review student requests and confirm classes',
    hiwTutor4: 'Build Your Reputation',
    hiwTutor4Desc: 'Earn trust scores and positive reviews',
    whyChoose: 'Why Choose Mentor Me?',
    whyDesc: 'Experience the best in online education and mentorship',
    verifiedTutors: 'Verified Tutors',
    verifiedTutorsDesc: 'All tutors are verified and ranked by trust score based on student reviews',
    smartMatching: 'Smart Matching',
    smartMatchingDesc: 'Our algorithm connects you with the best tutors based on your specific needs',
    flexibleLearning: 'Flexible Learning',
    flexibleLearningDesc: 'Choose online or in-person sessions, and set your own schedule and pace',
    ctaTitle: 'Ready to Get Started?',
    ctaDesc: 'Join thousands of students and tutors already learning together on Mentor Me',
    ctaFind: 'Find a Tutor Now',
    ctaTeach: 'Start Teaching',
    navDashboard: 'Dashboard',
    navSignIn: 'Sign In',
    navGetStarted: 'Get Started',
    footerForStudents: 'For Students',
    footerBrowse: 'Browse Tutors',
    footerSignupStudent: 'Sign Up',
    footerForTutors: 'For Tutors',
    footerBecomeTutor: 'Become a Tutor',
    footerHowItWorks: 'How It Works',
    footerSupport: 'Support',
    footerContact: 'Contact Us',
    footerPrivacy: 'Privacy Policy',
    recentLabel: 'Credentials',
  },
};

export default function Home() {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme, setTheme, language, setLanguage } = useUISettings();
  const isDark = theme === 'dark';
  const t = translations[language];

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
    <div className={`min-h-screen overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-gray-900'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full backdrop-blur-md z-50 transition-all duration-300 ${isDark ? 'bg-slate-900/80 border-b border-slate-800' : 'bg-white/80 border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gradient flex items-center gap-2">
            <Image src="/mentorme_logo.png" alt="MentorMe logo" width={44} height={44} className="rounded-md" />
            <span className="hidden sm:inline">Mentor Me</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-100 border border-gray-200'}`}>
              <button
                onClick={() => setLanguage('vi')}
                aria-label="Tiếng Việt"
                className={`px-2 py-1 rounded-full text-base transition ${language === 'vi' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow' : isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-white'}`}
              >
                🇻🇳
              </button>
              <button
                onClick={() => setLanguage('en')}
                aria-label="English"
                className={`px-2 py-1 rounded-full text-base transition ${language === 'en' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow' : isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-white'}`}
              >
                🇺🇸
              </button>
            </div>
            <div className={`flex items-center rounded-full px-1 py-1 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'}`}>
              <button
                onClick={() => setTheme('light')}
                aria-label="Light theme"
                className={`p-2 rounded-full transition ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-amber-600 hover:bg-white'} ${!isDark ? 'bg-yellow-100 shadow' : ''}`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                aria-label="Dark theme"
                className={`p-2 rounded-full transition ${isDark ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:bg-white'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
            {user ? (
              <>
                <Link
                  href={user.role === 'STUDENT' ? '/dashboard/student' : user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/tutor'}
                  className={`${isDark ? 'text-slate-100 hover:text-pink-300' : 'text-gray-700 hover:text-gradient'} font-medium transition-colors duration-300`}
                >
                  {t.navDashboard}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className={`${isDark ? 'text-slate-200 hover:text-white' : 'text-gray-700 hover:text-gray-900'} font-medium transition-colors duration-300`}>
                  {t.navSignIn}
                </Link>
                <Button
                  onClick={() => handleGetStarted('student')}
                  className="btn-gradient text-white font-semibold rounded-full px-6"
                >
                  {t.navGetStarted}
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
            <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full mb-6 border animate-fade-in-up ${isDark ? 'bg-white/5 border-white/15 text-slate-100' : 'bg-gradient-subtle border-purple-200'}`}>
              <Image src="/mentorme_logo.png" alt="MentorMe logo" width={40} height={40} className="rounded-full" />
              <span className="text-sm font-semibold text-gradient flex items-center gap-2">
                {t.welcome}
              </span>
            </div>

            <h1 className={`text-6xl sm:text-7xl font-bold mb-6 leading-tight animate-fade-in-up delay-100 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t.heroTitle1}
              <span className="text-gradient block mt-2">{t.heroTitle2}</span>
            </h1>
            <p className={`text-xl mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200 ${isDark ? 'text-slate-200' : 'text-gray-600'}`}>
              {t.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
              <button
                onClick={() => handleGetStarted('student')}
                className="btn-gradient text-white flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-2xl"
              >
                {t.btnFindTutor} <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleGetStarted('tutor')}
              className={`px-12 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl inline-flex items-center gap-2 ${
                isDark
                  ? 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
                  : 'border-2 border-gradient-to-r from-purple-600 to-pink-600 text-gray-900 hover:bg-gradient-subtle'
              }`}
            >
                {t.btnBecomeTutor} <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-in-up delay-400">
              {[
                { number: '10K+', label: t.statsTutors },
                { number: '50K+', label: t.statsStudents },
                { number: '4.8★', label: t.statsRating },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <p className="text-4xl font-bold text-gradient">{stat.number}</p>
                  <p className={`${isDark ? 'text-slate-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'} mt-2 transition-colors`}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={`py-24 px-4 sm:px-6 lg:px-8 relative ${isDark ? 'bg-slate-900/60' : 'bg-gradient-subtle'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.howItWorks}</h2>
            <p className={`text-xl ${isDark ? 'text-slate-200' : 'text-gray-600'}`}>{t.howDesc}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* For Students */}
            <div className={`card-hover rounded-2xl p-10 border transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'} ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-premium rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'vi' ? 'Cho học viên' : 'For Students'}</h3>
              </div>
              <ol className="space-y-6">
                {[
                  { title: t.hiwStudent1, desc: t.hiwStudent1Desc },
                  { title: t.hiwStudent2, desc: t.hiwStudent2Desc },
                  { title: t.hiwStudent3, desc: t.hiwStudent3Desc },
                  { title: t.hiwStudent4, desc: t.hiwStudent4Desc },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 group cursor-pointer">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-premium text-white rounded-full flex items-center justify-center font-bold text-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className={`font-semibold transition-colors ${isDark ? 'text-white group-hover:text-pink-200' : 'text-gray-900 group-hover:text-gradient'}`}>{item.title}</p>
                      <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-600'}`}>{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* For Tutors */}
            <div className={`card-hover rounded-2xl p-10 border transition-all duration-1000 transform delay-200 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'} ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-premium rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{language === 'vi' ? 'Cho gia sư' : 'For Tutors'}</h3>
              </div>
              <ol className="space-y-6">
                {[
                  { title: t.hiwTutor1, desc: t.hiwTutor1Desc },
                  { title: t.hiwTutor2, desc: t.hiwTutor2Desc },
                  { title: t.hiwTutor3, desc: t.hiwTutor3Desc },
                  { title: t.hiwTutor4, desc: t.hiwTutor4Desc },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 group cursor-pointer">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-premium text-white rounded-full flex items-center justify-center font-bold text-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className={`font-semibold transition-colors ${isDark ? 'text-white group-hover:text-pink-200' : 'text-gray-900 group-hover:text-gradient'}`}>{item.title}</p>
                      <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-gray-600'}`}>{item.desc}</p>
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
            <h2 className={`text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.whyChoose}</h2>
            <p className={`text-xl ${isDark ? 'text-slate-200' : 'text-gray-600'}`}>{t.whyDesc}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: t.verifiedTutors,
                desc: t.verifiedTutorsDesc,
                color: 'from-blue-600 to-purple-600',
              },
              {
                icon: Target,
                title: t.smartMatching,
                desc: t.smartMatchingDesc,
                color: 'from-purple-600 to-pink-600',
              },
              {
                icon: BookOpen,
                title: t.flexibleLearning,
                desc: t.flexibleLearningDesc,
                color: 'from-pink-600 to-red-600',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`card-hover rounded-2xl p-8 border group transition-all duration-1000 transform delay-${i * 100} ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                } ${isDark ? 'bg-slate-900/60 border-slate-800 shadow-lg shadow-slate-900/40' : 'bg-white border-gray-200 shadow-sm'}`}
              >
                <div className={`flex items-center justify-center w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-3 transition-colors ${isDark ? 'text-white group-hover:text-pink-200' : 'text-gray-900 group-hover:text-gradient'}`}>{feature.title}</h3>
                <p className={`leading-relaxed transition-colors ${isDark ? 'text-slate-200 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-700'}`}>{feature.desc}</p>
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
          <h2 className="text-5xl font-bold text-white mb-6">{t.ctaTitle}</h2>
          <p className="text-xl text-white/90 mb-12">
            {t.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleGetStarted('student')}
              className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              {t.ctaFind}
            </button>
            <button
              onClick={() => handleGetStarted('tutor')}
              className="px-8 py-4 bg-white/20 text-white rounded-full font-semibold text-lg border border-white/30 hover:bg-white/30 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm"
            >
              {t.ctaTeach}
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
              <h4 className="text-white font-semibold mb-4">{t.footerForStudents}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/tutors" className="hover:text-white transition-colors duration-300">
                    {t.footerBrowse}
                  </Link>
                </li>
                {!user && (
                  <li>
                    <Link href="/register?role=student" className="hover:text-white transition-colors duration-300">
                      {t.footerSignupStudent}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t.footerForTutors}</h4>
              <ul className="space-y-2 text-sm">
                {!user && (
                  <li>
                    <Link href="/register?role=tutor" className="hover:text-white transition-colors duration-300">
                      {t.footerBecomeTutor}
                    </Link>
                  </li>
                )}
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-300">
                    {t.footerHowItWorks}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t.footerSupport}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-300">
                    {t.footerContact}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-300">
                    {t.footerPrivacy}
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
