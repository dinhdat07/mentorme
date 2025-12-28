'use client';

import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient, ApiError } from '@/lib/api-client';
import { useUISettings } from '@/components/ui-settings-context';
import { CalendarDays } from 'lucide-react';
import { SessionStatus } from '@/lib/types';
import { useState } from 'react';

type CalendarSession = {
  id: string;
  classId: string;
  classTitle?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: SessionStatus;
  locationType?: string;
};

export default function StudentCalendarPage() {
  const { theme, language } = useUISettings();
  const { data, error, isLoading, mutate } = useSWR<CalendarSession[]>('/api/calendar/student', apiClient.get);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const t = {
    title: language === 'vi' ? 'Lịch học của tôi' : 'My Calendar',
    empty: language === 'vi' ? 'Chưa có buổi học sắp tới' : 'No upcoming sessions',
    refresh: language === 'vi' ? 'Tải lại' : 'Refresh',
  };

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const muted = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const card = theme === 'dark' ? 'bg-slate-900/70 border border-slate-800' : 'bg-white border border-slate-200';

  const canStart = (s: CalendarSession) => {
    const start = new Date(s.scheduledStartAt).getTime();
    const now = Date.now();
    return now >= start - 15 * 60 * 1000 && now <= start + 60 * 60 * 1000 && s.status === 'SCHEDULED';
  };
  const canComplete = (s: CalendarSession) => {
    const end = new Date(s.scheduledEndAt).getTime();
    return Date.now() >= end && s.status !== 'COMPLETED' && s.status !== 'CANCELLED' && s.status !== 'MISSED';
  };

  const doAction = async (id: string, action: 'start' | 'complete') => {
    setLoadingId(id);
    setActionError(null);
    try {
      await apiClient.patch(`/api/sessions/${id}/${action}`, {});
      await mutate();
    } catch (e: any) {
      const apiErr = e as ApiError;
      setActionError(apiErr?.message || 'Action failed');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <DashboardLayout requiredRole={['STUDENT']}>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-7 h-7 text-purple-500" />
          <div>
            <h1 className={`text-3xl font-bold ${textColor}`}>{t.title}</h1>
            <p className={muted}>Upcoming sessions for your booked classes.</p>
          </div>
          <button
            onClick={() => mutate()}
            className="ml-auto px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
          >
            {t.refresh}
          </button>
        </div>

        <div className={`rounded-xl p-6 ${card}`}>
          {isLoading && <p className={muted}>Loading...</p>}
          {error && <p className="text-red-500">{(error as ApiError).message || 'Error'}</p>}
          {actionError && <p className="text-red-500 mb-2">{actionError}</p>}
          {!isLoading && !error && data && data.length === 0 && <p className={muted}>{t.empty}</p>}
          <div className="space-y-3">
            {data?.map((s) => (
              <div
                key={s.id}
                className={`rounded-lg border px-4 py-3 flex items-center justify-between ${
                  theme === 'dark' ? 'border-slate-700 bg-slate-800/60 text-white' : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <p className="font-semibold">{s.classTitle || s.classId}</p>
                  <p className={`${muted} text-sm`}>
                    {new Date(s.scheduledStartAt).toLocaleString()} → {new Date(s.scheduledEndAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-purple-500">{s.status}</p>
                  {s.locationType && <p className={`${muted} text-xs`}>{s.locationType}</p>}
                  <div className="flex gap-2 justify-end mt-2">
                    {canStart(s) && (
                      <button
                        onClick={() => doAction(s.id, 'start')}
                        disabled={loadingId === s.id}
                        className="px-2 py-1 text-xs rounded-md bg-green-500 text-white"
                      >
                        {loadingId === s.id ? '...' : language === 'vi' ? 'Xác nhận bắt đầu' : 'Confirm start'}
                      </button>
                    )}
                    {canComplete(s) && (
                      <button
                        onClick={() => doAction(s.id, 'complete')}
                        disabled={loadingId === s.id}
                        className="px-2 py-1 text-xs rounded-md bg-blue-500 text-white"
                      >
                        {loadingId === s.id ? '...' : language === 'vi' ? 'Xác nhận hoàn thành' : 'Confirm complete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
