'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient, ApiError } from '@/lib/api-client';
import { useUISettings } from '@/components/ui-settings-context';
import { BadgeCheck, Clock, ShieldCheck, AlertTriangle, Upload, Plus, X } from 'lucide-react';

type ThemeMode = 'dark' | 'light';
type Language = 'vi' | 'en';
type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

const ImagePreview = ({ url, alt }: { url?: string; alt: string }) => {
  if (!url) return null;
  return (
    <div className="mt-2">
      <img
        src={url}
        alt={alt}
        className="h-28 w-full object-cover rounded-lg border border-slate-200 shadow-sm"
      />
    </div>
  );
};

const translations: Record<Language, any> = {
  vi: {
    title: 'Xác minh danh tính',
    subtitle: 'Cung cấp CCCD và giấy tờ để được duyệt trở thành gia sư',
    status: 'Trạng thái',
    statuses: {
      UNVERIFIED: 'Chưa xác minh',
      PENDING: 'Đang duyệt',
      VERIFIED: 'Đã xác minh',
      REJECTED: 'Bị từ chối',
    },
    cccd: 'Số CCCD',
    front: 'Ảnh CCCD mặt trước (URL)',
    back: 'Ảnh CCCD mặt sau (URL)',
    proof: 'Giấy tờ chứng minh (tuỳ chọn)',
    studentCard: 'Thẻ sinh viên / Thẻ học sinh (URL)',
    transcript: 'Bảng điểm (URL)',
    certificates: 'Chứng chỉ (loại, tiêu đề, đơn vị cấp, ngày cấp, ảnh URL)',
    addCert: 'Thêm chứng chỉ',
    remove: 'Xoá',
    submit: 'Gửi xác minh',
    resubmit: 'Gửi lại',
    pendingMsg: 'Hồ sơ đang chờ duyệt. Vui lòng đợi admin xem xét.',
    verifiedMsg: 'Bạn đã được xác minh. Hồ sơ công khai sẽ hiển thị là gia sư đã duyệt.',
    rejectedMsg: 'Hồ sơ bị từ chối. Vui lòng chỉnh sửa và gửi lại.',
    notes: 'Ghi chú từ admin',
    submittedAt: 'Ngày gửi',
    reviewedAt: 'Ngày duyệt',
    masked: 'Đã ẩn ẩn danh CCCD',
    error: 'Không thể gửi xác minh',
    success: 'Gửi thành công! Trạng thái chuyển sang Đang duyệt.',
    helper: 'Chúng tôi chỉ lưu 4 số cuối để hiển thị, thông tin sẽ được bảo vệ.',
    pendingBlocked: 'Hồ sơ đang chờ duyệt, bạn không thể gửi mới lúc này.',
  },
  en: {
    title: 'Identity Verification',
    subtitle: 'Provide ID and documents to become a verified tutor',
    status: 'Status',
    statuses: {
      UNVERIFIED: 'Unverified',
      PENDING: 'Pending',
      VERIFIED: 'Verified',
      REJECTED: 'Rejected',
    },
    cccd: 'National ID number',
    front: 'ID Front Image (URL)',
    back: 'ID Back Image (URL)',
    proof: 'Proof documents (optional)',
    studentCard: 'Student card (URL)',
    transcript: 'Transcript (URL)',
    certificates: 'Certificates (type, title, issuer, issue date, image URL)',
    addCert: 'Add certificate',
    remove: 'Remove',
    submit: 'Submit verification',
    resubmit: 'Resubmit',
    pendingMsg: 'Your submission is pending review. Please wait for approval.',
    verifiedMsg: 'You are verified. Public profile is shown as verified.',
    rejectedMsg: 'Your submission was rejected. Please fix issues and resubmit.',
    notes: 'Admin notes',
    submittedAt: 'Submitted at',
    reviewedAt: 'Reviewed at',
    masked: 'ID is masked for safety',
    error: 'Failed to submit verification',
    success: 'Submitted! Status set to Pending.',
    helper: 'Only last 4 digits are shown; data is protected.',
    pendingBlocked: 'Submission blocked because your request is already pending review.',
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    card: 'bg-slate-900/80 border border-slate-800',
    text: 'text-slate-100',
    muted: 'text-slate-300',
    input: 'bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500',
    badge: 'bg-slate-800 text-slate-100 border border-slate-700',
  },
  light: {
    card: 'bg-white border border-slate-200 shadow-sm',
    text: 'text-slate-900',
    muted: 'text-slate-600',
    input: 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-purple-400 focus:border-purple-200',
    badge: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
};

export default function TutorVerificationPage() {
  const { theme, language } = useUISettings();
  const styles = themeStyles[theme];
  const t = translations[language];

  const { data, mutate } = useSWR('/api/tutors/me/verification', apiClient.get);
  const [form, setForm] = useState({
    nationalIdNumber: '',
    nationalIdFrontImageUrl: '',
    nationalIdBackImageUrl: '',
    studentCardUrl: '',
    transcriptUrl: '',
    certificates: [{ type: '', title: '', issuer: '', issueDate: '', imageUrl: '' }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const status: VerificationStatus | undefined = data?.verificationStatus;
  const isPending = status === 'PENDING';
  const isVerified = status === 'VERIFIED';
  const isRejected = status === 'REJECTED';

  useEffect(() => {
    if (data) {
      setForm((prev) => ({
        ...prev,
        nationalIdNumber: data.nationalIdNumber || '',
        nationalIdFrontImageUrl: data.nationalIdFrontImageUrl || '',
        nationalIdBackImageUrl: data.nationalIdBackImageUrl || '',
        studentCardUrl: data.proofDocuments?.studentCardUrl || '',
        transcriptUrl: data.proofDocuments?.transcriptUrl || '',
        certificates:
          Array.isArray(data.certificatesDetail) && data.certificatesDetail.length > 0
            ? data.certificatesDetail
            : prev.certificates,
      }));
    }
  }, [data]);

  const statusBadge = useMemo(() => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold border';
    if (status === 'VERIFIED')
      return `${base} bg-green-100 text-green-700 border-green-200 dark:bg-emerald-900/70 dark:text-emerald-100 dark:border-emerald-700`;
    if (status === 'PENDING')
      return `${base} bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/70 dark:text-amber-100 dark:border-amber-700`;
    if (status === 'REJECTED')
      return `${base} bg-red-100 text-red-700 border-red-200 dark:bg-rose-900/70 dark:text-rose-100 dark:border-rose-700`;
    return `${base} bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600`;
  }, [status, styles.badge]);

  const handleCertChange = (idx: number, key: string, value: string) => {
    setForm((prev) => {
      const next = [...prev.certificates];
      next[idx] = { ...next[idx], [key]: value };
      return { ...prev, certificates: next };
    });
  };

  const addCertificate = () => {
    setForm((prev) => ({
      ...prev,
      certificates: [...prev.certificates, { type: '', title: '', issuer: '', issueDate: '', imageUrl: '' }],
    }));
  };

  const removeCertificate = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    setValidationError(null);
    try {
      const urls = [
        form.nationalIdFrontImageUrl,
        form.nationalIdBackImageUrl,
        form.studentCardUrl,
        form.transcriptUrl,
        ...form.certificates.map((c) => c.imageUrl),
      ].filter(Boolean);
      const invalid = urls.find((u) => u && !u.startsWith('https://'));
      if (invalid) {
        setValidationError('URLs must start with https://');
        setSubmitting(false);
        return;
      }
      const payload = {
        nationalIdNumber: form.nationalIdNumber.trim(),
        nationalIdFrontImageUrl: form.nationalIdFrontImageUrl.trim(),
        nationalIdBackImageUrl: form.nationalIdBackImageUrl.trim(),
        proofDocuments: {
          studentCardUrl: form.studentCardUrl.trim() || undefined,
          transcriptUrl: form.transcriptUrl.trim() || undefined,
        },
        certificatesDetail: form.certificates
          .filter((c) => c.type || c.title || c.issuer || c.issueDate || c.imageUrl)
          .map((c) => ({
            type: c.type,
            title: c.title,
            issuer: c.issuer,
            issueDate: c.issueDate,
            imageUrl: c.imageUrl,
          })),
      };
      if (!payload.nationalIdNumber || !payload.nationalIdFrontImageUrl || !payload.nationalIdBackImageUrl) {
        throw new Error(t.error);
      }
      await apiClient.put('/api/tutors/me/verification', payload);
      setMessage(t.success);
      mutate();
    } catch (err: any) {
      const raw = err instanceof ApiError ? err.message : err?.message || t.error;
      const msg =
        raw && raw.toLowerCase().includes('not allowed')
          ? t.pendingBlocked
          : raw;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const disableForm = isPending || isVerified;

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            {t.title}
          </h1>
          <p className={styles.muted}>{t.subtitle}</p>
        </div>

        <div className={`rounded-xl p-6 ${styles.card} space-y-4`}>
          <div className="flex items-center gap-3">
            {status === 'VERIFIED' && <ShieldCheck className="w-6 h-6 text-green-500" />}
            {status === 'PENDING' && <Clock className="w-6 h-6 text-amber-500" />}
            {status === 'REJECTED' && <AlertTriangle className="w-6 h-6 text-red-500" />}
            {(!status || status === 'UNVERIFIED') && <BadgeCheck className="w-6 h-6 text-slate-400" />}
            <div>
              <p className={`text-sm ${styles.muted}`}>{t.status}</p>
              <p className={`text-xl font-bold ${styles.text}`}>{t.statuses[status || 'UNVERIFIED']}</p>
            </div>
            <span className={statusBadge}>{status || 'UNVERIFIED'}</span>
          </div>

          <div className={`text-sm ${styles.muted}`}>
            {status === 'PENDING' && t.pendingMsg}
            {status === 'VERIFIED' && t.verifiedMsg}
            {status === 'REJECTED' && t.rejectedMsg}
            {!status || status === 'UNVERIFIED' ? t.helper : ''}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className={styles.muted}>{t.submittedAt}</p>
              <p className={styles.text}>{data?.verificationSubmittedAt ? new Date(data.verificationSubmittedAt).toLocaleString() : '—'}</p>
            </div>
            <div>
              <p className={styles.muted}>{t.reviewedAt}</p>
              <p className={styles.text}>{data?.verificationReviewedAt ? new Date(data.verificationReviewedAt).toLocaleString() : '—'}</p>
            </div>
          </div>

          {isRejected && data?.verificationNotes && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
              <p className="font-semibold">{t.notes}:</p>
              <p>{data.verificationNotes}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={`rounded-xl p-6 space-y-6 ${styles.card}`}>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          {validationError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{validationError}</div>}
          {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{message}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${styles.text}`}>{t.cccd}</label>
              <input
                type="text"
                value={form.nationalIdNumber}
                onChange={(e) => setForm((p) => ({ ...p, nationalIdNumber: e.target.value }))}
                className={`w-full rounded-lg px-3 py-2 ${styles.input}`}
                disabled={disableForm}
              />
              <p className={`text-xs mt-1 ${styles.muted}`}>{t.masked}</p>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${styles.text}`}>{t.front}</label>
              <input
                type="url"
                value={form.nationalIdFrontImageUrl}
                onChange={(e) => setForm((p) => ({ ...p, nationalIdFrontImageUrl: e.target.value }))}
                className={`w-full rounded-lg px-3 py-2 ${styles.input}`}
                disabled={disableForm}
                placeholder="https://..."
              />
              <ImagePreview url={form.nationalIdFrontImageUrl} alt="Front ID preview" />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${styles.text}`}>{t.back}</label>
              <input
                type="url"
                value={form.nationalIdBackImageUrl}
                onChange={(e) => setForm((p) => ({ ...p, nationalIdBackImageUrl: e.target.value }))}
                className={`w-full rounded-lg px-3 py-2 ${styles.input}`}
                disabled={disableForm}
                placeholder="https://..."
              />
              <ImagePreview url={form.nationalIdBackImageUrl} alt="Back ID preview" />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${styles.text}`}>{t.studentCard}</label>
              <input
                type="url"
                value={form.studentCardUrl}
                onChange={(e) => setForm((p) => ({ ...p, studentCardUrl: e.target.value }))}
                className={`w-full rounded-lg px-3 py-2 ${styles.input}`}
                disabled={disableForm}
                placeholder="https://..."
              />
              <ImagePreview url={form.studentCardUrl} alt="Student card preview" />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${styles.text}`}>{t.transcript}</label>
              <input
                type="url"
                value={form.transcriptUrl}
                onChange={(e) => setForm((p) => ({ ...p, transcriptUrl: e.target.value }))}
                className={`w-full rounded-lg px-3 py-2 ${styles.input}`}
                disabled={disableForm}
                placeholder="https://..."
              />
              <ImagePreview url={form.transcriptUrl} alt="Transcript preview" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`text-sm font-semibold ${styles.text}`}>{t.certificates}</label>
              <button
                type="button"
                onClick={addCertificate}
                disabled={disableForm}
                className="text-xs px-3 py-1 rounded-md border border-purple-300 text-purple-600 hover:bg-purple-50 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> {t.addCert}
              </button>
            </div>
            <div className="space-y-2">
              {form.certificates.map((cert, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <input
                    type="text"
                    value={cert.type}
                    onChange={(e) => handleCertChange(idx, 'type', e.target.value)}
                    placeholder="Type"
                    className={`px-3 py-2 rounded-lg ${styles.input}`}
                    disabled={disableForm}
                  />
                  <input
                    type="text"
                    value={cert.title}
                    onChange={(e) => handleCertChange(idx, 'title', e.target.value)}
                    placeholder="Title"
                    className={`px-3 py-2 rounded-lg ${styles.input}`}
                    disabled={disableForm}
                  />
                  <input
                    type="text"
                    value={cert.issuer}
                    onChange={(e) => handleCertChange(idx, 'issuer', e.target.value)}
                    placeholder="Issuer"
                    className={`px-3 py-2 rounded-lg ${styles.input}`}
                    disabled={disableForm}
                  />
                  <input
                    type="date"
                    value={cert.issueDate}
                    onChange={(e) => handleCertChange(idx, 'issueDate', e.target.value)}
                    className={`px-3 py-2 rounded-lg ${styles.input}`}
                    disabled={disableForm}
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={cert.imageUrl}
                        onChange={(e) => handleCertChange(idx, 'imageUrl', e.target.value)}
                        placeholder="Image URL"
                        className={`px-3 py-2 rounded-lg ${styles.input} flex-1`}
                        disabled={disableForm}
                      />
                      {form.certificates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCertificate(idx)}
                          disabled={disableForm}
                          className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-500 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <ImagePreview url={cert.imageUrl} alt={`Certificate ${idx + 1}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={disableForm || submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {submitting ? '...' : isRejected ? t.resubmit : t.submit}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
