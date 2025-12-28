'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient, ApiError } from '@/lib/api-client';
import { PaymentSummary } from '@/lib/types';
import { useUISettings } from '@/components/ui-settings-context';

export default function StudentPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { theme, language } = useUISettings();
  const { data: summary, mutate } = useSWR<PaymentSummary>(
    classId ? `/api/classes/${classId}/payments/summary` : null,
    apiClient.get
  );
  const { data: bookingCheck } = useSWR(
    classId ? `/api/bookings/me?classId=${classId}` : null,
    apiClient.get
  );
  const [depositCount, setDepositCount] = useState(4);
  const [amountPerSession, setAmountPerSession] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (bookingCheck && !bookingCheck.bookingExists) {
    return (
      <DashboardLayout requiredRole={['STUDENT']}>
        <div className="p-8 space-y-3">
          <p className="text-red-600">
            {language === 'vi' ? 'Bạn chưa đặt lớp này. Hãy đặt lớp trước.' : 'No booking for this class. Please book first.'}
          </p>
          <Link href={`/classes/${classId}/book`} className="text-purple-600 underline">
            {language === 'vi' ? 'Đặt lớp' : 'Go to booking'}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const text = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const muted = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const card = theme === 'dark' ? 'bg-slate-900/70 border border-slate-800' : 'bg-white border border-slate-200 shadow-sm';

  const handlePay = async () => {
    if (!summary) return;
    setSubmitting(true);
    setError('');
    try {
      const intent = await apiClient.post(`/api/classes/${classId}/payments/intents`, {
        packageSessionsCount: depositCount,
        amountPerSession: amountPerSession ?? summary.nextReleaseAmount ?? 0,
      });
      await apiClient.post(`/api/payments/${intent.id}/confirm`, {});
      mutate();
    } catch (err: any) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || 'Không thể thanh toán');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout requiredRole={['STUDENT']}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className={`text-3xl font-bold ${text}`}>{language === 'vi' ? 'Thanh toán ký quỹ' : 'Class payment'}</h1>
          <p className={muted}>{language === 'vi' ? 'Nạp ký quỹ và xem lịch sử giao dịch' : 'Deposit escrow and view ledger'}</p>
        </div>

        {!summary ? (
          <p className={muted}>{language === 'vi' ? 'Đang tải...' : 'Loading...'}</p>
        ) : (
          <div className={`p-6 rounded-xl ${card} space-y-4`}>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200">
                <p className="text-sm font-semibold text-purple-600">{language === 'vi' ? 'Số dư ký quỹ' : 'Escrow balance'}</p>
                <p className="text-lg font-bold text-purple-700">{summary.escrow.availableBalance.toLocaleString('vi-VN')} ₫</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">{language === 'vi' ? 'Đã giải ngân' : 'Released'}</p>
                <p className="text-lg font-bold text-slate-800">{summary.escrow.releasedAmount.toLocaleString('vi-VN')} ₫</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1">{language === 'vi' ? 'Số buổi' : 'Sessions'}</label>
                <select
                  value={depositCount}
                  onChange={(e) => setDepositCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  {[4, 8, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">{language === 'vi' ? 'Giá mỗi buổi (₫)' : 'Amount per session (₫)'}</label>
                <input
                  type="number"
                  value={amountPerSession ?? summary.nextReleaseAmount ?? 0}
                  onChange={(e) => setAmountPerSession(Number(e.target.value) || summary.nextReleaseAmount || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={submitting}
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow"
            >
              {submitting ? '...' : language === 'vi' ? 'Thanh toán (mock)' : 'Pay (mock)'}
            </button>

            <div className="space-y-2">
              <p className="font-semibold">{language === 'vi' ? 'Lịch sử giao dịch' : 'Ledger'}</p>
              <div className="space-y-1 max-h-48 overflow-auto">
                {summary.ledger.length === 0 && <p className={muted}>{language === 'vi' ? 'Chưa có giao dịch' : 'No entries yet'}</p>}
                {summary.ledger.map((l) => (
                  <div key={l.id} className="flex items-center justify-between border border-slate-200 rounded px-2 py-1 text-sm">
                    <span>{l.type}</span>
                    <span>{l.amount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.back()} className="px-4 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50">
            {language === 'vi' ? 'Quay lại' : 'Back'}
          </button>
          <Link href="/dashboard/student/my-classes" className="px-4 py-2 rounded-lg bg-slate-100 text-sm border border-slate-200">
            {language === 'vi' ? 'Lớp của tôi' : 'My classes'}
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
