'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTutors } from '@/hooks/useTutors';
import { useSubjects } from '@/hooks/useSubjects';
import { TutorCard } from '@/components/tutor-card';
import { SidebarNav } from '@/components/sidebar-nav';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Tìm kiếm gia sư',
    subtitle: 'Chọn gia sư phù hợp với mục tiêu học tập của bạn',
    filters: 'Bộ lọc',
    subject: 'Môn học',
    allSubjects: 'Tất cả môn học',
    city: 'Thành phố',
    cityPlaceholder: 'Nhập thành phố',
    maxPrice: 'Giá tối đa',
    trust: 'Điểm tin cậy tối thiểu',
    reset: 'Đặt lại',
    previous: 'Trước',
    next: 'Tiếp',
    page: 'Trang',
    empty: 'Không tìm thấy gia sư phù hợp',
    emptyCta: 'Đặt lại bộ lọc',
    perHour: '/giờ',
  },
  en: {
    title: 'Discover Expert Tutors',
    subtitle: 'Find the perfect tutor matched to your learning goals',
    filters: 'Filters',
    subject: 'Subject',
    allSubjects: 'All Subjects',
    city: 'City',
    cityPlaceholder: 'Enter city',
    maxPrice: 'Max Price',
    trust: 'Min Trust Score',
    reset: 'Reset Filters',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    empty: 'No tutors found matching your criteria',
    emptyCta: 'Reset Filters',
    perHour: '/hour',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    page: 'bg-slate-950',
    hero: 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white',
    textMuted: 'text-white/80',
    card: 'bg-white/10 border border-white/15 text-white',
    input: 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-purple-500 focus:border-transparent',
    option: 'bg-slate-900',
    chip: 'text-white/90 border border-white/20',
    buttonPrimary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white',
    buttonGhost: 'bg-white/10 border border-white/20 text-white hover:border-white/40',
    pageBadge: 'glass rounded-lg font-semibold text-white/90 border border-white/20 backdrop-blur-sm px-6 py-2',
  },
  light: {
    page: 'bg-slate-50',
    hero: 'bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500 text-white',
    textMuted: 'text-slate-600',
    card: 'bg-white border border-slate-200 text-slate-900 shadow-sm',
    input: 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-purple-400 focus:border-purple-200',
    option: 'bg-white',
    chip: 'text-slate-700 border border-slate-200',
    buttonPrimary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-sm',
    buttonGhost: 'bg-slate-100 border border-slate-200 text-slate-800 hover:border-slate-300',
    pageBadge: 'rounded-lg font-semibold text-slate-700 border border-slate-200 bg-white shadow-sm px-6 py-2',
  },
};

export default function TutorsPage() {
  const { subjects } = useSubjects();
  const { theme, language } = useUISettings();
  const [filters, setFilters] = useState({
    subjectId: '',
    city: '',
    priceMin: 0,
    priceMax: 500,
    trustScoreMin: 0,
    page: 1,
    pageSize: 12,
  });

  const { tutors, isLoading } = useTutors(filters);
  const t = translations[language];
  const styles = themeStyles[theme];

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      subjectId: '',
      city: '',
      priceMin: 0,
      priceMax: 500,
      trustScoreMin: 0,
      page: 1,
      pageSize: 12,
    });
  };

  return (
    <div className={`flex h-screen ${styles.page}`}>
      <SidebarNav theme={theme} />
      <main className="flex-1 overflow-auto">
        <div className={`${styles.hero} p-8 sticky top-0 z-40 shadow-lg backdrop-blur-sm transition-colors`}>
          <h1 className="text-4xl font-bold mb-2 animate-fade-in-up">{t.title}</h1>
          <p className={`animate-fade-in-up delay-100 ${styles.textMuted}`}>{t.subtitle}</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-4 gap-6">
            <div className={`group rounded-2xl p-6 h-fit sticky top-32 transition-all duration-300 shadow-lg ${styles.card}`}>
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" />
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t.filters}</h2>
              </div>

              <div className="space-y-6">
                {/* Subject Filter */}
                <div className="animate-fade-in-up">
                  <label className={`block text-sm font-semibold mb-2 ${styles.textMuted}`}>{t.subject}</label>
                  <select
                    value={filters.subjectId}
                    onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg transition-all ${styles.input}`}
                  >
                    <option value="" className={styles.option}>{t.allSubjects}</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id} className={styles.option}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Filter */}
                <div className="animate-fade-in-up delay-100">
                  <label className={`block text-sm font-semibold mb-2 ${styles.textMuted}`}>{t.city}</label>
                  <div className="relative">
                    <Search className={`absolute left-3 top-2.5 w-4 h-4 ${styles.textMuted}`} />
                    <input
                      type="text"
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      placeholder={t.cityPlaceholder}
                      className={`w-full pl-9 pr-3 py-2 rounded-lg transition-all ${styles.input}`}
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div className="animate-fade-in-up delay-200">
                  <label className={`block text-sm font-semibold mb-3 ${styles.textMuted}`}>
                    {t.maxPrice}: <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">${filters.priceMax}{t.perHour}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.priceMax}
                    onChange={(e) => handleFilterChange('priceMax', Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>

                {/* Trust Score Filter */}
                <div className="animate-fade-in-up delay-300">
                  <label className={`block text-sm font-semibold mb-3 ${styles.textMuted}`}>
                    {t.trust}: <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{filters.trustScoreMin}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.trustScoreMin}
                    onChange={(e) => handleFilterChange('trustScoreMin', Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>

                <button
                  onClick={resetFilters}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 animate-fade-in-up delay-400 shadow-lg ${styles.buttonPrimary}`}
                >
                  <RotateCcw className="w-4 h-4" />
                  {t.reset}
                </button>
              </div>
            </div>

            {/* Tutors Grid */}
            <div className="col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-to-r from-purple-600 to-pink-600" />
                </div>
              ) : tutors.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {tutors.map((tutor, idx) => (
                      <div key={tutor.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-fade-in-up">
                        <TutorCard tutor={tutor} />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-12 animate-fade-in-up">
                    <button
                      disabled={filters.page === 1}
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      className={`px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${styles.buttonPrimary}`}
                    >
                      {t.previous}
                    </button>
                    <span className={styles.pageBadge}>
                      {t.page} {filters.page}
                    </span>
                    <button
                      disabled={tutors.length < filters.pageSize}
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      className={`px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${styles.buttonPrimary}`}
                    >
                      {t.next}
                    </button>
                  </div>
                </>
              ) : (
                <div className={`rounded-2xl p-12 text-center animate-fade-in transition ${styles.card}`}>
                  <p className={`${styles.textMuted} text-lg mb-4`}>{t.empty}</p>
                  <button
                    onClick={resetFilters}
                    className={`inline-block px-6 py-2 rounded-lg font-semibold transition-all shadow-lg ${styles.buttonPrimary}`}
                  >
                    {t.emptyCta}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
