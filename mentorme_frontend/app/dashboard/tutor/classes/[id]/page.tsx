'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useSubjects } from '@/hooks/useSubjects';
import { apiClient, ApiError } from '@/lib/api-client';
import useSWR from 'swr';
import { Class } from '@/lib/types';
import { useUISettings } from '@/components/ui-settings-context';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';

const translations: Record<Language, any> = {
  vi: {
    title: 'Chỉnh sửa lớp',
    notFound: 'Không tìm thấy lớp học',
    back: 'Quay lại',
    subject: 'Môn học *',
    subjectPlaceholder: 'Chọn môn',
    classTitle: 'Tiêu đề lớp *',
    classTitlePh: 'VD: Toán nâng cao cho lớp 9',
    description: 'Mô tả *',
    descriptionPh: 'Mô tả lớp học',
    grade: 'Khối/Lớp mục tiêu',
    gradePh: 'VD: Lớp 9',
    price: 'Học phí (VNĐ/giờ) *',
    priceHint: 'Đơn vị: VNĐ/giờ',
    location: 'Hình thức dạy *',
    city: 'Thành phố',
    cityPh: 'Ví dụ: Hà Nội',
    district: 'Quận/Huyện',
    districtPh: 'Ví dụ: Cầu Giấy',
    online: 'Online',
    atStudent: 'Tại nhà học viên',
    atTutor: 'Tại nhà gia sư',
    saving: 'Đang lưu...',
    save: 'Lưu lớp học',
    cancel: 'Hủy',
    error: 'Có lỗi xảy ra',
  },
  en: {
    title: 'Edit Class',
    notFound: 'Class not found',
    back: 'Back',
    subject: 'Subject *',
    subjectPlaceholder: 'Select a subject',
    classTitle: 'Class Title *',
    classTitlePh: 'e.g., Advanced Math for Grade 9',
    description: 'Description *',
    descriptionPh: 'Describe your class',
    grade: 'Target Grade',
    gradePh: 'e.g., Grade 9',
    price: 'Price (VND/hour) *',
    priceHint: 'Currency: VND/hour',
    location: 'Teaching Location *',
    city: 'City',
    cityPh: 'Your city',
    district: 'District',
    districtPh: 'Your district',
    online: 'Online',
    atStudent: 'At Student Location',
    atTutor: 'At Tutor Location',
    saving: 'Saving...',
    save: 'Save Class',
    cancel: 'Cancel',
    error: 'Something went wrong',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    card: 'glass rounded-xl backdrop-blur-md border border-white/20 p-8',
    label: 'text-white/90',
    input:
      'w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200',
    select:
      'w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200',
    heading: 'text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8',
    buttonPrimary:
      'flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50',
    buttonGhost:
      'flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300',
    hint: 'text-white/70 text-sm',
    error: 'bg-red-500/10 border border-red-500/40 text-red-200',
    muted: 'text-white/70',
  },
  light: {
    card: 'bg-white rounded-xl border border-slate-200 p-8 shadow-sm',
    label: 'text-slate-800',
    input:
      'w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-200 transition-all duration-200',
    select:
      'w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-200 transition-all duration-200',
    heading: 'text-4xl font-bold text-slate-900 mb-8',
    buttonPrimary:
      'flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-sm',
    buttonGhost:
      'flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-lg transition-all duration-300',
    hint: 'text-slate-600 text-sm',
    error: 'bg-red-100 border border-red-200 text-red-700',
    muted: 'text-slate-600',
  },
};

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { subjects } = useSubjects();
  const { theme, language } = useUISettings();
  const t = translations[language];
  const styles = themeStyles[theme];

  const { data: classData, isLoading: classLoading } = useSWR<Class>(`/api/classes/${classId}`, apiClient.get);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    description: '',
    targetGrade: '',
    pricePerHour: 20,
    locationType: 'ONLINE' as 'ONLINE' | 'AT_STUDENT' | 'AT_TUTOR',
    city: '',
    district: '',
  });

  useEffect(() => {
    if (classData) {
      setFormData({
        subjectId: classData.subjectId,
        title: classData.title || '',
        description: classData.description || '',
        targetGrade: classData.targetGrade || '',
        pricePerHour: classData.pricePerHour || 20,
        locationType: classData.locationType || 'ONLINE',
        city: classData.city || '',
        district: classData.district || '',
      });
    }
  }, [classData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'pricePerHour' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIssues([]);
    setIsSaving(true);

    try {
      await apiClient.patch(`/api/classes/${classId}`, formData);
      router.push('/dashboard/tutor/classes');
    } catch (err: any) {
      if (err instanceof ApiError) {
        const issueMessages =
          err.data?.issues?.map((i: any) => {
            const path = Array.isArray(i.path) ? i.path.join('.') : '';
            return path ? `${path}: ${i.message}` : i.message;
          }) || [];
        setIssues(issueMessages);
        setError(err.message || t.error);
      } else {
        setError(err?.message || t.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (classLoading) {
    return (
      <DashboardLayout requiredRole={['TUTOR']}>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout requiredRole={['TUTOR']}>
        <div className="p-8 space-y-2">
          <p className="text-gray-600">{t.notFound}</p>
          <Link href="/dashboard/tutor/classes" className="text-blue-600 hover:underline">
            ← {t.back}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8">
        <h1 className={`${styles.heading} leading-tight mb-6`}>{t.title}</h1>

        <form onSubmit={handleSubmit} className={`${styles.card} max-w-2xl`}>
          <div className="space-y-6">
            {error && (
              <div className={`${styles.error} px-4 py-3 rounded-lg space-y-2`}>
                <div className="font-semibold">{error}</div>
                {issues.length > 0 && (
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${styles.label}`}>{t.subject}</label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option
                  value=""
                  className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-slate-800'}
                >
                  {t.subjectPlaceholder}
                </option>
                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                    className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-slate-800'}
                  >
                    {subject.name} ({subject.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${styles.label}`}>{t.classTitle}</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder={t.classTitlePh}
                className={styles.input}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${styles.label}`}>{t.description}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t.descriptionPh}
                rows={4}
                className={`${styles.input} resize-none`}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${styles.label}`}>{t.grade}</label>
                <input
                  type="text"
                  name="targetGrade"
                  value={formData.targetGrade}
                  onChange={handleChange}
                  placeholder={t.gradePh}
                  className={styles.input}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-sm font-medium ${styles.label}`}>{t.price}</label>
                  <span className={styles.hint}>{t.priceHint}</span>
                </div>
                <input
                  type="number"
                  name="pricePerHour"
                  value={formData.pricePerHour}
                  onChange={handleChange}
                  min="1"
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${styles.label}`}>{t.location}</label>
              <select
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="ONLINE" className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-slate-800'}>
                  {t.online}
                </option>
                <option
                  value="AT_STUDENT"
                  className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-slate-800'}
                >
                  {t.atStudent}
                </option>
                <option value="AT_TUTOR" className={theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-slate-800'}>
                  {t.atTutor}
                </option>
              </select>
            </div>

            {formData.locationType !== 'ONLINE' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${styles.label}`}>{t.city}</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={t.cityPh}
                    className={styles.input}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${styles.label}`}>{t.district}</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder={t.districtPh}
                    className={styles.input}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button type="submit" disabled={isSaving} className={styles.buttonPrimary}>
                {isSaving ? t.saving : t.save}
              </button>
              <button type="button" onClick={() => router.back()} className={styles.buttonGhost}>
                {t.cancel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
