'use client';

import { useEffect, useState } from 'react';
import { useTutors } from '@/hooks/useTutors';
import { useSubjects } from '@/hooks/useSubjects';
import { TutorCard } from '@/components/tutor-card';
import { SidebarNav } from '@/components/sidebar-nav';
import { Search, Filter, RotateCcw, Sparkles } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';
import { apiClient } from '@/lib/api-client';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Tìm kiếm gia sư',
    subtitle: 'Chọn gia sư phù hợp với mục tiêu học tập của bạn',
    searchLabel: 'Tìm kiếm',
    searchPlaceholder: 'Ví dụ: Toán 9, Nguyễn Văn A',
    filters: 'Bộ lọc',
    subject: 'Môn học',
    allSubjects: 'Tất cả môn học',
    city: 'Thành phố',
    cityPlaceholder: 'Nhập thành phố',
    maxPrice: 'Giá tối đa',
    trust: 'Điểm tin cậy tối thiểu',
    reset: 'Đặt lại',
    tabSearch: 'Tìm kiếm thường',
    tabAi: 'AI Matching',
    previous: 'Trước',
    next: 'Tiếp',
    page: 'Trang',
    empty: 'Không tìm thấy gia sư phù hợp',
    emptyCta: 'Đặt lại bộ lọc',
    perHour: 'VNĐ/giờ',
    aiTitle: 'AI Matching',
    aiSubtitle: 'Gợi ý gia sư phù hợp theo nhu cầu học của bạn',
    aiSubject: 'Môn học (bắt buộc)',
    aiGrade: 'Lớp/Trình độ',
    aiBudget: 'Ngân sách (VNĐ/giờ)',
    aiDescription: 'Mô tả nhu cầu',
    aiTime: 'Khung giờ mong muốn',
    aiDay: 'Thứ trong tuần',
    aiFrom: 'Từ',
    aiTo: 'Đến',
    aiButton: 'Tìm bằng AI',
    aiResults: 'Kết quả AI Matching',
    aiEmpty: 'Chưa có gợi ý - hãy nhập nhu cầu và bấm tìm',
    aiCity: 'Thành phố (tuỳ chọn)',
    aiScore: 'Điểm phù hợp',
  },
  en: {
    title: 'Discover Expert Tutors',
    subtitle: 'Find the perfect tutor matched to your learning goals',
    searchLabel: 'Search',
    searchPlaceholder: 'e.g., Grade 9 Math, Alice',
    filters: 'Filters',
    subject: 'Subject',
    allSubjects: 'All Subjects',
    city: 'City',
    cityPlaceholder: 'Enter city',
    maxPrice: 'Max Price',
    trust: 'Min Trust Score',
    reset: 'Reset Filters',
    tabSearch: 'Search',
    tabAi: 'AI Matching',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    empty: 'No tutors found matching your criteria',
    emptyCta: 'Reset Filters',
    perHour: 'VND/hour',
    aiTitle: 'AI Matching',
    aiSubtitle: 'Let AI suggest tutors that fit your needs',
    aiSubject: 'Subject (required)',
    aiGrade: 'Grade/Level',
    aiBudget: 'Budget (VND/hour)',
    aiDescription: 'Learning goals',
    aiTime: 'Preferred time',
    aiDay: 'Day of week',
    aiFrom: 'From',
    aiTo: 'To',
    aiButton: 'Match with AI',
    aiResults: 'AI Matching Results',
    aiEmpty: 'No AI results yet - fill the form and run matching',
    aiCity: 'City (optional)',
    aiScore: 'Match score',
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
    priceMax: 500000,
    trustScoreMin: 0,
    q: '',
    page: 1,
    pageSize: 12,
  });

  const [searchFilters, setSearchFilters] = useState(filters);
  const [aiForm, setAiForm] = useState({
    subjectId: '',
    gradeLevel: '',
    city: '',
    budgetPerHour: 200000,
    description: '',
    slots: [
      { dayOfWeek: 1, startTime: '', endTime: '' },
    ],
  });
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { tutors, isLoading } = useTutors(searchFilters);
  const t = translations[language];
  const styles = themeStyles[theme];
  const [activeTab, setActiveTab] = useState<'search' | 'ai'>('search');
  const dayOptions = [
    { value: 0, vi: 'Chủ nhật', en: 'Sunday' },
    { value: 1, vi: 'Thứ 2', en: 'Monday' },
    { value: 2, vi: 'Thứ 3', en: 'Tuesday' },
    { value: 3, vi: 'Thứ 4', en: 'Wednesday' },
    { value: 4, vi: 'Thứ 5', en: 'Thursday' },
    { value: 5, vi: 'Thứ 6', en: 'Friday' },
    { value: 6, vi: 'Thứ 7', en: 'Saturday' },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // Ensure a subject is always selected (no "all subjects" option)
  useEffect(() => {
    if (subjects.length > 0) {
      setFilters((prev) => (prev.subjectId ? prev : { ...prev, subjectId: subjects[0].id }));
      setAiForm((prev) => (prev.subjectId ? prev : { ...prev, subjectId: subjects[0].id }));
    }
  }, [subjects]);

  const resetFilters = () => {
    const base = {
      subjectId: '',
      city: '',
      priceMin: 0,
      priceMax: 500000,
      trustScoreMin: 0,
      q: '',
      page: 1,
      pageSize: 12,
    };
    setFilters(base);
    setSearchFilters(base);
  };

  const handleSearch = () => {
    setSearchFilters(filters);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map((v) => Number(v));
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };

  const handleAiSearch = async () => {
    setAiError(null);
    const subjectId = aiForm.subjectId || filters.subjectId || subjects[0]?.id;
    if (!subjectId) {
      setAiError(language === 'vi' ? 'Vui lòng chọn môn học để dùng AI Matching' : 'Please pick a subject to run AI matching');
      return;
    }

    let validSlots: { dayOfWeek: number; startMinute: number; endMinute: number }[] = [];
    try {
      validSlots = aiForm.slots
        .map((slot) => {
          const startMinute = timeToMinutes(slot.startTime);
          const endMinute = timeToMinutes(slot.endTime);
          if (!slot.startTime && !slot.endTime) return null; // allow blank slot
          if (!slot.startTime || !slot.endTime) {
            throw new Error(language === 'vi' ? 'Khung giờ chưa đủ thông tin' : 'Please complete start/end time');
          }
          if (Number.isNaN(startMinute) || Number.isNaN(endMinute) || endMinute <= startMinute) {
            throw new Error(language === 'vi' ? 'Khung giờ không hợp lệ' : 'Invalid time range');
          }
          return {
            dayOfWeek: Number(slot.dayOfWeek),
            startMinute,
            endMinute,
          };
        })
        .filter((slot): slot is { dayOfWeek: number; startMinute: number; endMinute: number } => slot !== null);
    } catch (err: any) {
      setAiError(err?.message || (language === 'vi' ? 'Khung giờ không hợp lệ' : 'Invalid time'));
      return;
    }

    const payload = {
      subjectId,
      gradeLevel: aiForm.gradeLevel.trim() || (language === 'vi' ? 'Chung' : 'General'),
      city: aiForm.city.trim() || filters.city || undefined,
      budgetPerHour: Math.max(50000, aiForm.budgetPerHour || filters.priceMax || 200000),
      desiredSlots: validSlots,
      description: aiForm.description.trim() || filters.q || undefined,
      limit: 6,
    };

    setAiLoading(true);
    try {
      // Tạo cảm giác loading rõ ràng hơn trước khi nhận kết quả
      await sleep(600);
      const matches = await apiClient.post<any[]>('/api/matching/tutors', payload);
      console.log('AI matching response', matches);
      setAiResults(matches || []);
    } catch (error: any) {
      setAiError(error?.message || (language === 'vi' ? 'Không thể chạy AI Matching' : 'Failed to run AI matching'));
    } finally {
      setAiLoading(false);
    }
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
          <div className={`grid ${activeTab === 'ai' ? 'grid-cols-1' : 'grid-cols-4'} gap-6`}>
            {activeTab === 'search' && (
              <div className={`group rounded-2xl p-6 h-fit sticky top-32 transition-all duration-300 shadow-lg ${styles.card}`}>
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" />
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t.filters}</h2>
              </div>

              <div className="space-y-6">
                {/* Search by tutor/class */}
                <div className="animate-fade-in-up">
                  <label className={`block text-sm font-semibold mb-2 ${styles.textMuted}`}>{t.searchLabel}</label>
                  <div className="relative">
                    <Search className={`absolute left-3 top-2.5 w-4 h-4 ${styles.textMuted}`} />
                    <input
                      type="text"
                      value={filters.q}
                      onChange={(e) => handleFilterChange('q', e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className={`w-full pl-9 pr-3 py-2 rounded-lg transition-all ${styles.input}`}
                    />
                  </div>
                </div>

                {/* Subject Filter */}
                <div className="animate-fade-in-up">
                  <label className={`block text-sm font-semibold mb-2 ${styles.textMuted}`}>{t.subject}</label>
                  <select
                    value={filters.subjectId}
                    onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg transition-all ${styles.input}`}
                  >
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
                    {t.maxPrice}: <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{filters.priceMax.toLocaleString('vi-VN')} ₫/giờ</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    step="50000"
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

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSearch}
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${styles.buttonPrimary}`}
                  >
                    <Search className="w-4 h-4" />
                    {t.searchLabel}
                  </button>
                  <button
                    onClick={resetFilters}
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${styles.buttonGhost}`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t.reset}
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Tutors Grid + AI Matching */}
            <div className={`${activeTab === 'search' ? 'col-span-3' : ''} space-y-6`}>
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('search')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
                    activeTab === 'search'
                      ? styles.buttonPrimary
                      : `${styles.buttonGhost} opacity-80`
                  }`}
                >
                  {t.tabSearch}
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
                    activeTab === 'ai'
                      ? styles.buttonPrimary
                      : `${styles.buttonGhost} opacity-80`
                  }`}
                >
                  {t.tabAi}
                </button>
              </div>

              {activeTab === 'ai' ? (
                <div className={`rounded-2xl p-6 shadow-lg space-y-6 ${styles.card}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {t.aiTitle}
                        </h3>
                      </div>
                      <p className={`text-sm mt-1 ${styles.textMuted}`}>{t.aiSubtitle}</p>
                    </div>
                    {aiResults.length > 0 && (
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${styles.chip}`}>
                        {t.aiResults}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${styles.textMuted}`}>{t.aiSubject}</label>
                  <select
                    value={aiForm.subjectId || filters.subjectId}
                    onChange={(e) => setAiForm((prev) => ({ ...prev, subjectId: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg transition-all ${styles.input}`}
                  >
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id} className={styles.option}>
                        {subject.name}
                      </option>
                    ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${styles.textMuted}`}>{t.aiGrade}</label>
                      <input
                        type="text"
                        value={aiForm.gradeLevel}
                        onChange={(e) => setAiForm((prev) => ({ ...prev, gradeLevel: e.target.value }))}
                        placeholder={language === 'vi' ? 'Ví dụ: Lớp 9, IELTS 6.5' : 'e.g., Grade 9, IELTS 6.5'}
                        className={`w-full px-3 py-2 rounded-lg transition-all ${styles.input}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${styles.textMuted}`}>{t.aiCity}</label>
                      <input
                        type="text"
                        value={aiForm.city || filters.city}
                        onChange={(e) => setAiForm((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder={t.cityPlaceholder}
                        className={`w-full px-3 py-2 rounded-lg transition-all ${styles.input}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${styles.textMuted}`}>
                        {t.aiBudget}: <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{aiForm.budgetPerHour.toLocaleString('vi-VN')} ₫/giờ</span>
                      </label>
                      <input
                        type="range"
                        min={50000}
                        max={500000}
                        step={50000}
                        value={aiForm.budgetPerHour}
                        onChange={(e) => setAiForm((prev) => ({ ...prev, budgetPerHour: Number(e.target.value) }))}
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div className="col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className={`block text-sm font-semibold ${styles.textMuted}`}>
                          {t.aiTime} <span className="text-xs opacity-70">({language === 'vi' ? 'có thể bỏ trống' : 'optional'})</span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setAiForm((prev) => ({
                              ...prev,
                              slots: [...prev.slots, { dayOfWeek: 1, startTime: '', endTime: '' }],
                            }))
                          }
                          className={`text-xs px-3 py-1 rounded-md border ${styles.buttonGhost}`}
                        >
                          {language === 'vi' ? 'Thêm khung giờ' : 'Add slot'}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {aiForm.slots.map((slot, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-3 items-center">
                            <select
                              value={slot.dayOfWeek}
                              onChange={(e) =>
                                setAiForm((prev) => {
                                  const next = [...prev.slots];
                                  next[idx] = { ...next[idx], dayOfWeek: Number(e.target.value) };
                                  return { ...prev, slots: next };
                                })
                              }
                              className={`w-full px-3 py-2 rounded-lg transition-all ${styles.input}`}
                            >
                              {dayOptions.map((day) => (
                                <option key={day.value} value={day.value} className={styles.option}>
                                  {language === 'vi' ? day.vi : day.en}
                                </option>
                              ))}
                            </select>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                setAiForm((prev) => {
                                  const next = [...prev.slots];
                                  next[idx] = { ...next[idx], startTime: e.target.value };
                                  return { ...prev, slots: next };
                                })
                              }
                              className={`w-full px-3 py-2 rounded-lg transition-all ${styles.input}`}
                              aria-label={t.aiFrom}
                            />
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) =>
                                  setAiForm((prev) => {
                                    const next = [...prev.slots];
                                    next[idx] = { ...next[idx], endTime: e.target.value };
                                    return { ...prev, slots: next };
                                  })
                                }
                                className={`w-full px-3 py-2 rounded-lg transition-all ${styles.input}`}
                                aria-label={t.aiTo}
                              />
                              {aiForm.slots.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAiForm((prev) => ({
                                      ...prev,
                                      slots: prev.slots.filter((_, sIdx) => sIdx !== idx),
                                    }))
                                  }
                                  className="text-xs px-2 py-1 rounded-md border border-red-300 text-red-500 hover:bg-red-50"
                                >
                                  X
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className={`block text-sm font-semibold mb-2 ${styles.textMuted}`}>{t.aiDescription}</label>
                      <textarea
                        value={aiForm.description}
                        onChange={(e) => setAiForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder={language === 'vi' ? 'Ví dụ: Cần ôn thi cấp 3, học trực tuyến 2 buổi tối/tuần' : 'Describe your goals, schedule preference, online/offline, etc.'}
                        className={`w-full px-3 py-2 rounded-lg transition-all resize-none min-h-[90px] ${styles.input}`}
                      />
                    </div>
                  </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAiSearch}
                  disabled={aiLoading}
                      className={`px-5 py-2 rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2 ${styles.buttonPrimary} ${aiLoading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      <Sparkles className="w-4 h-4" />
                      {aiLoading ? (language === 'vi' ? 'Đang gợi ý...' : 'Matching...') : t.aiButton}
                </button>
                {aiError && <span className="text-sm text-red-500">{aiError}</span>}
              </div>

              <div className="pt-2 min-h-[140px]">
                {aiLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gradient-to-r from-purple-600 to-pink-600" />
                  </div>
                ) : aiResults.length > 0 ? (
                  <div className="grid grid-cols-3 gap-6">
                    {aiResults.map((match, idx) => (
                      <div key={match.tutor?.id ?? idx} style={{ animationDelay: `${idx * 40}ms` }} className="relative animate-fade-in-up">
                        <div className="absolute top-3 right-3 z-10 rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow">
                          {t.aiScore}: {(match.score ?? 0).toFixed(2)}
                        </div>
                        <TutorCard tutor={match.tutor ?? match} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`rounded-xl p-4 text-sm ${styles.textMuted} ${styles.card}`}>
                    {t.aiEmpty}
                  </div>
                )}
              </div>
            </div>
          ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
