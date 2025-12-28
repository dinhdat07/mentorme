'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { useTutorClasses } from '@/hooks/useTutorClasses';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { Plus, Edit, Archive, CheckCircle } from 'lucide-react';
import { useUISettings } from '@/components/ui-settings-context';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Lớp học của tôi',
    create: 'Tạo lớp mới',
    published: 'Đã đăng',
    draft: 'Bản nháp',
    archived: 'Lưu trữ',
    price: 'Giá',
    type: 'Hình thức',
    nonePublished: 'Chưa có lớp đã đăng',
    noneDraft: 'Chưa có bản nháp',
    noneArchived: 'Chưa có lớp lưu trữ',
    edit: 'Chỉnh sửa',
    schedule: 'Lịch học',
    archive: 'Lưu trữ',
    publish: 'Đăng',
    view: 'Xem',
  },
  en: {
    title: 'My Classes',
    create: 'Create New Class',
    published: 'Published',
    draft: 'Draft',
    archived: 'Archived',
    price: 'Price',
    type: 'Type',
    nonePublished: 'No published classes',
    noneDraft: 'No draft classes',
    noneArchived: 'No archived classes',
    edit: 'Edit',
    schedule: 'Schedule',
    archive: 'Archive',
    publish: 'Publish',
    view: 'View',
  },
};

const themeStyles: Record<ThemeMode, Record<string, any>> = {
  dark: {
    text: 'text-white',
    muted: 'text-white/70',
    card: 'backdrop-blur-md bg-white/10 border border-white/15',
    badgePublished: 'text-green-100',
    badgeDraft: 'text-yellow-200',
    badgeArchived: 'text-slate-300',
    header: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
    buttonPrimary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/40',
    chip: 'text-white/70',
  },
  light: {
    text: 'text-slate-900',
    muted: 'text-slate-600',
    card: 'bg-white border border-slate-200 shadow-sm',
    badgePublished: 'text-green-700',
    badgeDraft: 'text-amber-700',
    badgeArchived: 'text-slate-500',
    header: 'text-gradient',
    buttonPrimary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-sm',
    chip: 'text-slate-700',
  },
};

export default function TutorClassesPage() {
  const { classes, isLoading, mutate } = useTutorClasses();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { theme, language } = useUISettings();
  const t = translations[language];
  const styles = themeStyles[theme];
  const buttonTone = (variant: 'edit' | 'archive' | 'schedule' | 'publish') => {
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 border shadow-sm';
    if (variant === 'edit') {
      return `${base} ${
        theme === 'dark'
          ? 'bg-purple-500/25 text-purple-100 border-purple-300/40 hover:bg-purple-500/35'
          : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
      }`;
    }
    if (variant === 'archive') {
      return `${base} ${
        theme === 'dark'
          ? 'bg-red-500/20 text-red-100 border-red-300/40 hover:bg-red-500/30'
          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
      }`;
    }
    if (variant === 'publish') {
      return `${base} ${
        theme === 'dark'
          ? 'bg-green-500/20 text-green-100 border-green-300/40 hover:bg-green-500/30'
          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
      }`;
    }
    return `${base} ${
      theme === 'dark'
        ? 'bg-blue-500/20 text-blue-100 border-blue-300/40 hover:bg-blue-500/30'
        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    }`;
  };

  const handleUpdateStatus = async (classId: string, newStatus: 'PUBLISHED' | 'ARCHIVED' | 'DRAFT') => {
    try {
      setProcessingId(classId);
      await apiClient.patch(`/api/classes/${classId}/status`, {
        status: newStatus,
      });
      mutate();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const groupedClasses = {
    DRAFT: classes.filter((c) => c.status === 'DRAFT'),
    PUBLISHED: classes.filter((c) => c.status === 'PUBLISHED'),
    ARCHIVED: classes.filter((c) => c.status === 'ARCHIVED'),
  };

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8 transition-colors duration-300 space-y-8">
        <div className="flex items-center justify-between mb-10">
          <h1 className={`text-4xl font-bold leading-tight mb-2 ${styles.header}`}>{t.title}</h1>
          <Link
            href="/dashboard/tutor/classes/new"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${styles.buttonPrimary}`}
          >
            <Plus size={20} />
            {t.create}
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Published Classes */}
            <div className="animate-fadeIn" style={{ animationDelay: '0ms' }}>
              <h2 className={`text-2xl font-bold mb-4 ${styles.text}`}>
                {t.published} <span className={styles.badgePublished}>({groupedClasses.PUBLISHED.length})</span>
              </h2>
              {groupedClasses.PUBLISHED.length > 0 ? (
                <div className="space-y-3">
                  {groupedClasses.PUBLISHED.map((cls, idx) => (
                    <div key={cls.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className={`rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 ${styles.card} ${theme === 'dark' ? 'hover:border-green-400/50 shadow-lg shadow-green-500/20' : 'hover:border-green-300'} border`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className={`text-lg font-bold ${styles.text}`}>{cls.title}</h3>
                              <CheckCircle size={20} className="text-green-500" />
                            </div>
                            <p className={`text-sm mb-3 line-clamp-1 ${styles.muted}`}>{cls.description}</p>
                            <div className="flex gap-6 text-sm">
                              <span className={styles.muted}>
                                <span className="text-purple-400">{t.price}:</span> {cls.pricePerHour.toLocaleString('vi-VN')} ₫/giờ
                              </span>
                              <span className={styles.muted}>
                                <span className="text-purple-400">{t.type}:</span> {cls.locationType}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Link
                              href={`/dashboard/tutor/classes/${cls.id}`}
                              className={buttonTone('edit')}
                            >
                              <Edit size={16} />
                              {t.edit}
                            </Link>
                            <button
                              onClick={() => handleUpdateStatus(cls.id, 'ARCHIVED')}
                              disabled={processingId === cls.id}
                              className={`${buttonTone('archive')} disabled:opacity-50`}
                            >
                              <Archive size={16} />
                              {processingId === cls.id ? '...' : t.archive}
                            </button>
                            <Link
                              href={`/dashboard/tutor/classes/${cls.id}/schedule`}
                              className={buttonTone('schedule')}
                            >
                              {t.schedule}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-xl p-6 text-center ${styles.card}`}>
                  <p className={`${styles.muted}`}>{t.nonePublished}</p>
                </div>
              )}
            </div>

            {/* Draft Classes */}
            <div className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
              <h2 className={`text-2xl font-bold mb-4 ${styles.text}`}>
                {t.draft} <span className={styles.badgeDraft}>({groupedClasses.DRAFT.length})</span>
              </h2>
              {groupedClasses.DRAFT.length > 0 ? (
                <div className="space-y-3">
                  {groupedClasses.DRAFT.map((cls, idx) => (
                    <div key={cls.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className={`rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 ${styles.card} ${theme === 'dark' ? 'hover:border-yellow-400/50 shadow-lg shadow-yellow-500/20' : 'hover:border-amber-300'} border`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`text-lg font-bold mb-2 ${styles.text}`}>{cls.title}</h3>
                            <p className={`text-sm mb-3 line-clamp-1 ${styles.muted}`}>{cls.description}</p>
                            <div className="flex gap-6 text-sm">
                              <span className={styles.muted}>
                                <span className="text-purple-400">{t.price}:</span> {cls.pricePerHour.toLocaleString('vi-VN')} ₫/giờ
                              </span>
                              <span className={styles.muted}>
                                <span className="text-purple-400">{t.type}:</span> {cls.locationType}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Link
                              href={`/dashboard/tutor/classes/${cls.id}`}
                              className={buttonTone('edit')}
                            >
                              <Edit size={16} />
                              {t.edit}
                            </Link>
                            <button
                              onClick={() => handleUpdateStatus(cls.id, 'PUBLISHED')}
                              disabled={processingId === cls.id}
                              className={`${buttonTone('publish')} disabled:opacity-50`}
                            >
                              <CheckCircle size={16} />
                              {processingId === cls.id ? '...' : t.publish}
                            </button>
                            <Link
                              href={`/dashboard/tutor/classes/${cls.id}/schedule`}
                              className={buttonTone('schedule')}
                            >
                              {t.schedule}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-xl p-6 text-center ${styles.card}`}>
                  <p className={`${styles.muted}`}>{t.noneDraft}</p>
                </div>
              )}
            </div>

            {/* Archived Classes */}
            <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <h2 className={`text-2xl font-bold mb-4 ${styles.text}`}>
                {t.archived} <span className={styles.badgeArchived}>({groupedClasses.ARCHIVED.length})</span>
              </h2>
              {groupedClasses.ARCHIVED.length > 0 ? (
                <div className="space-y-3">
                  {groupedClasses.ARCHIVED.map((cls, idx) => (
                    <div key={cls.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className={`rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 ${styles.card} ${theme === 'dark' ? 'hover:border-white/30 shadow-lg shadow-slate-500/10' : 'hover:border-slate-300'} border`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`text-lg font-bold mb-2 ${styles.muted}`}>{cls.title}</h3>
                            <p className={`text-sm mb-3 line-clamp-1 ${styles.muted}`}>{cls.description}</p>
                            <div className="flex gap-6 text-sm">
                              <span className={styles.muted}>
                                <span className="text-purple-400">{t.price}:</span> {cls.pricePerHour.toLocaleString('vi-VN')} ₫/giờ
                              </span>
                              <span className={styles.muted}>
                                <span className="text-purple-400">{t.type}:</span> {cls.locationType}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/tutor/classes/${cls.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 border bg-white/10 hover:bg-white/20 text-slate-700"
                          >
                            {t.view}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-xl p-6 text-center ${styles.card}`}>
                  <p className={`${styles.muted}`}>{t.noneArchived}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
