'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import { useUISettings } from '@/components/ui-settings-context';
import { ShieldCheck, Clock, XCircle, CheckCircle, FileText, Eye } from 'lucide-react';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';
type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

const translations: Record<Language, any> = {
  vi: {
    title: 'Duyệt xác minh gia sư',
    filter: 'Lọc theo trạng thái',
    statuses: {
      ALL: 'Tất cả',
      PENDING: 'Đang duyệt',
      VERIFIED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      UNVERIFIED: 'Chưa gửi',
    },
    submittedAt: 'Ngày gửi',
    reviewedAt: 'Ngày duyệt',
    approve: 'Duyệt',
    reject: 'Từ chối',
    note: 'Ghi chú',
    placeholderNote: 'Lý do hoặc ghi chú cho gia sư',
    detail: 'Chi tiết',
    idNumber: 'CCCD/ID',
    front: 'Ảnh mặt trước',
    back: 'Ảnh mặt sau',
    proof: 'Giấy tờ',
    certificates: 'Chứng chỉ',
    noData: 'Không có yêu cầu',
  },
  en: {
    title: 'Tutor Verification Review',
    filter: 'Filter by status',
    statuses: {
      ALL: 'All',
      PENDING: 'Pending',
      VERIFIED: 'Verified',
      REJECTED: 'Rejected',
      UNVERIFIED: 'Unverified',
    },
    submittedAt: 'Submitted at',
    reviewedAt: 'Reviewed at',
    approve: 'Approve',
    reject: 'Reject',
    note: 'Notes',
    placeholderNote: 'Reason or note to tutor',
    detail: 'Details',
    idNumber: 'National ID',
    front: 'Front image',
    back: 'Back image',
    proof: 'Proof documents',
    certificates: 'Certificates',
    noData: 'No verification requests',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    card: 'bg-slate-900/80 border border-slate-800',
    text: 'text-slate-50',
    muted: 'text-slate-300',
    input:
      'bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500',
    badge: 'bg-slate-800 text-slate-50 border border-slate-700',
  },
  light: {
    card: 'bg-white border border-slate-200 shadow-sm',
    text: 'text-slate-900',
    muted: 'text-slate-600',
    input: 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-purple-400 focus:border-purple-200',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
};

const statusBadge = (status: VerificationStatus | 'ALL', theme: ThemeMode) => {
  const base = 'px-2 py-1 rounded-full text-xs font-semibold border';
  const verified = `${base} bg-green-100 text-green-700 border-green-200 dark:bg-emerald-900/70 dark:text-emerald-100 dark:border-emerald-700`;
  const pending = `${base} bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/70 dark:text-amber-100 dark:border-amber-700`;
  const rejected = `${base} bg-red-100 text-red-700 border-red-200 dark:bg-rose-900/70 dark:text-rose-100 dark:border-rose-700`;
  const def = `${base} bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600`;
  if (status === 'VERIFIED') return verified;
  if (status === 'PENDING') return pending;
  if (status === 'REJECTED') return rejected;
  return def;
};

export default function AdminVerificationsPage() {
  const { theme, language } = useUISettings();
  const styles = themeStyles[theme];
  const t = translations[language];
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'ALL'>('PENDING');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data, mutate, isLoading } = useSWR(
    `/api/admin/tutor-verifications${statusFilter === 'ALL' ? '' : `?status=${statusFilter}`}`,
    apiClient.get
  );

  const selected = data?.find((t: any) => t.id === selectedId) || null;

  const act = async (action: 'approve' | 'reject', id: string) => {
    if (action === 'reject' && !note.trim()) {
      alert(language === 'vi' ? 'Vui lòng nhập ghi chú khi từ chối' : 'Please add a note to reject');
      return;
    }
    if (!confirm(action === 'approve' ? 'Approve this tutor?' : 'Reject this tutor?')) return;
    setProcessing(true);
    try {
      await apiClient.patch(`/api/admin/tutor-verifications/${id}/${action}`, action === 'approve' ? {} : { note });
      setNote('');
      await mutate();
    } catch (err) {
      console.error('Verification action failed', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout requiredRole={['ADMIN']}>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {t.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <label className={`text-sm ${styles.muted}`}>{t.filter}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`rounded-lg px-3 py-2 text-sm ${styles.input}`}
            >
              {['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'UNVERIFIED'].map((s) => (
                <option key={s} value={s}>
                  {t.statuses[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${styles.card}`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin h-10 w-10 border-b-2 border-purple-500 rounded-full" />
            </div>
          ) : data && data.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {data.map((tutor: any) => (
                <button
                  key={tutor.id}
                  onClick={() => setSelectedId(tutor.id)}
                  className={`text-left rounded-lg p-4 border transition text-opacity-100 ${
                    selectedId === tutor.id
                      ? theme === 'dark'
                        ? 'border-purple-500 shadow-lg bg-slate-900/80 text-slate-100'
                        : 'border-purple-500 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50 text-slate-900'
                      : theme === 'dark'
                        ? 'border-slate-700 hover:border-purple-400 bg-slate-900/60 text-slate-100'
                        : 'border-slate-200 hover:border-purple-300 bg-white text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <p className="font-semibold">{tutor.user?.fullName || tutor.userId}</p>
                  </div>
                  <p className="text-xs truncate text-slate-500 dark:text-slate-300">{tutor.user?.email}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={statusBadge(tutor.verificationStatus, theme)}>{tutor.verificationStatus}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-300">
                      {t.submittedAt || tutor.verificationSubmittedAt
                        ? new Date(tutor.verificationSubmittedAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.muted}>{t.noData}</p>
          )}
        </div>

        {selected && (
          <div className={`rounded-xl p-6 ${styles.card} space-y-4 text-opacity-100 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold">{t.detail}</h2>
              <span className={statusBadge(selected.verificationStatus, theme)}>{selected.verificationStatus}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className={styles.muted}>{t.submittedAt}</p>
                <p className={styles.text}>
                  {selected.verificationSubmittedAt ? new Date(selected.verificationSubmittedAt).toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <p className={styles.muted}>{t.reviewedAt}</p>
                <p className={styles.text}>
                  {selected.verificationReviewedAt ? new Date(selected.verificationReviewedAt).toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <p className={styles.muted}>{t.idNumber}</p>
                <p className="font-semibold">{selected.nationalIdNumber || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-sm font-semibold ${styles.text}`}>{t.front}</p>
                {selected.nationalIdFrontImageUrl ? (
                  <a className="text-purple-500 underline text-sm" href={selected.nationalIdFrontImageUrl} target="_blank" rel="noreferrer">
                    {selected.nationalIdFrontImageUrl}
                  </a>
                ) : (
                  <p className={styles.muted}>—</p>
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold ${styles.text}`}>{t.back}</p>
                {selected.nationalIdBackImageUrl ? (
                  <a className="text-purple-500 underline text-sm" href={selected.nationalIdBackImageUrl} target="_blank" rel="noreferrer">
                    {selected.nationalIdBackImageUrl}
                  </a>
                ) : (
                  <p className={styles.muted}>—</p>
                )}
              </div>
            </div>

            <div>
              <p className={`text-sm font-semibold ${styles.text}`}>{t.proof}</p>
              <div className="space-y-1 text-sm">
                {selected.proofDocuments?.studentCardUrl && (
                  <a className="text-purple-500 underline" href={selected.proofDocuments.studentCardUrl} target="_blank" rel="noreferrer">
                    Student card
                  </a>
                )}
                {selected.proofDocuments?.transcriptUrl && (
                  <a className="text-purple-500 underline" href={selected.proofDocuments.transcriptUrl} target="_blank" rel="noreferrer">
                    Transcript
                  </a>
                )}
                {!selected.proofDocuments?.studentCardUrl && !selected.proofDocuments?.transcriptUrl && (
                  <p className={styles.muted}>—</p>
                )}
              </div>
            </div>

            <div>
              <p className={`text-sm font-semibold mb-2 ${styles.text}`}>{t.certificates}</p>
              {Array.isArray(selected.certificatesDetail) && selected.certificatesDetail.length > 0 ? (
                <div className="space-y-2">
                  {selected.certificatesDetail.map((c: any, idx: number) => (
                    <div key={idx} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <p className="font-semibold">{c.title || c.type || '—'}</p>
                      <p className={styles.muted}>{c.issuer}</p>
                      <p className={styles.muted}>{c.issueDate}</p>
                      {c.imageUrl && (
                        <a className="text-purple-500 underline text-xs" href={c.imageUrl} target="_blank" rel="noreferrer">
                          {c.imageUrl}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.muted}>—</p>
              )}
            </div>

            {selected.verificationStatus === 'PENDING' && (
              <>
                <div className="space-y-2">
                  <label className={`text-sm font-semibold ${styles.text}`}>{t.note}</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t.placeholderNote}
                    className={`w-full rounded-lg px-3 py-2 ${styles.input}`}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => act('approve', selected.id)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> {t.approve}
                  </button>
                  <button
                    onClick={() => act('reject', selected.id)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> {t.reject}
                  </button>
                </div>
              </>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-100"
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
