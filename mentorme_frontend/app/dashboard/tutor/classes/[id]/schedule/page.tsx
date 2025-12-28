'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient, ApiError } from '@/lib/api-client';
import { useUISettings } from '@/components/ui-settings-context';
import { Session } from '@/lib/types';

type ScheduleResponse = {
  schedule: {
    timezone: string;
    totalSessions: number;
    recurrenceRule?: any;
    explicitSessions?: any;
  } | null;
  class: {
    id: string;
    title: string;
    lifecycleStatus?: string;
    totalSessions?: number;
    sessionsCompleted?: number;
  };
  sessions: Session[];
};

const dayOptions = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map((v) => parseInt(v, 10));
  return h * 60 + (m || 0);
};

export default function ClassSchedulePage() {
  const params = useParams<{ id: string }>();
  const classId = params?.id;
  const { theme, language } = useUISettings();
  const { data, error, isLoading, mutate } = useSWR<ScheduleResponse>(
    classId ? `/api/classes/${classId}/schedule` : null,
    apiClient.get
  );

  const [timezone, setTimezone] = useState('UTC');
  const [startDate, setStartDate] = useState('');
  const [weeks, setWeeks] = useState(4);
  const [slots, setSlots] = useState([{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }]);
  const [explicit, setExplicit] = useState([{ startDate: '', startTime: '', endDate: '', endTime: '' }]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const muted = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const card = theme === 'dark' ? 'bg-slate-900/70 border border-slate-800' : 'bg-white border border-slate-200';

  const submitLabel = language === 'vi' ? 'Lưu lịch' : 'Save schedule';

  const handleSlotChange = (idx: number, key: string, val: any) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));
  };

  const handleExplicitChange = (idx: number, key: string, val: any) => {
    setExplicit((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));
  };

  const addSlot = () => setSlots((prev) => [...prev, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }]);
  const addExplicit = () =>
    setExplicit((prev) => [...prev, { startDate: '', startTime: '', endDate: '', endTime: '' }]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const slotPayload = slots
        .filter((s) => s.startTime && s.endTime)
        .map((s) => ({
          dayOfWeek: Number(s.dayOfWeek),
          startMinute: toMinutes(s.startTime),
          endMinute: toMinutes(s.endTime),
        }))
        .filter((s) => s.endMinute > s.startMinute);

      const explicitPayload = explicit
        .filter((s) => s.startDate && s.startTime && s.endTime)
        .map((s) => ({
          startAt: new Date(`${s.startDate}T${s.startTime}:00Z`).toISOString(),
          endAt: new Date(`${s.endDate || s.startDate}T${s.endTime}:00Z`).toISOString(),
        }))
        .filter((s) => new Date(s.endAt) > new Date(s.startAt));

      const payload: any = { timezone };
      if (startDate && slotPayload.length > 0) {
        payload.recurrence = {
          startDate: new Date(startDate).toISOString(),
          weeks: weeks || 1,
          slots: slotPayload,
        };
      }
      if (explicitPayload.length > 0) {
        payload.explicitSessions = explicitPayload;
      }

      await apiClient.post(`/api/classes/${classId}/schedule`, payload);
      mutate();
    } catch (err) {
      const apiErr = err as ApiError;
      setSubmitError(apiErr?.message || 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const sessions = useMemo(() => data?.sessions || [], [data]);
  const progressLabel =
    data && data.class
      ? `${data.class.sessionsCompleted || 0}/${data.class.totalSessions || data.schedule?.totalSessions || sessions.length} (${data.class.lifecycleStatus || ''})`
      : '';

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className={`text-3xl font-bold ${textColor}`}>{language === 'vi' ? 'Lịch lớp học' : 'Class schedule'}</h1>
          <p className={muted}>
            {language === 'vi'
              ? 'Tạo lịch học theo tuần hoặc nhập buổi học cụ thể. Lỗi xung đột sẽ hiển thị từ backend.'
              : 'Create weekly recurrence or explicit sessions. Conflict errors are shown from the backend.'}
          </p>
          {progressLabel && <p className={`${muted} text-sm mt-1`}>{language === 'vi' ? 'Tiến độ: ' : 'Progress: '}{progressLabel}</p>}
        </div>

        <form onSubmit={onSubmit} className={`rounded-xl p-6 space-y-4 ${card}`}>
          {submitError && <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded">{submitError}</div>}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-1">Timezone</label>
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">{language === 'vi' ? 'Ngày bắt đầu tuần' : 'Week start date'}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1">{language === 'vi' ? 'Số tuần' : 'Weeks'}</label>
              <input
                type="number"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{language === 'vi' ? 'Lặp tuần' : 'Weekly recurrence'}</h2>
              <button type="button" onClick={addSlot} className="text-sm text-purple-600">
                + Slot
              </button>
            </div>
            <div className="space-y-2">
              {slots.map((s, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2">
                  <select
                    value={s.dayOfWeek}
                    onChange={(e) => handleSlotChange(idx, 'dayOfWeek', parseInt(e.target.value, 10))}
                    className="px-3 py-2 rounded-lg border border-slate-200"
                  >
                    {dayOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={s.startTime}
                    onChange={(e) => handleSlotChange(idx, 'startTime', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200"
                  />
                  <input
                    type="time"
                    value={s.endTime}
                    onChange={(e) => handleSlotChange(idx, 'endTime', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{language === 'vi' ? 'Buổi cụ thể' : 'Explicit sessions'}</h2>
              <button type="button" onClick={addExplicit} className="text-sm text-purple-600">
                + Session
              </button>
            </div>
            <div className="space-y-2">
              {explicit.map((s, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2">
                  <input
                    type="date"
                    value={s.startDate}
                    onChange={(e) => handleExplicitChange(idx, 'startDate', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200"
                  />
                  <input
                    type="time"
                    value={s.startTime}
                    onChange={(e) => handleExplicitChange(idx, 'startTime', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200"
                  />
                  <input
                    type="time"
                    value={s.endTime}
                    onChange={(e) => handleExplicitChange(idx, 'endTime', e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200"
                  />
                  <input
                    type="date"
                    value={s.endDate}
                    onChange={(e) => handleExplicitChange(idx, 'endDate', e.target.value)}
                    placeholder="End date"
                    className="px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow"
          >
            {submitting ? '...' : submitLabel}
          </button>
        </form>

        <div className={`rounded-xl p-6 ${card}`}>
          <h3 className="text-xl font-semibold mb-2">{language === 'vi' ? 'Các buổi đã tạo' : 'Generated sessions'}</h3>
          {isLoading && <p className={muted}>Loading...</p>}
          {error && <p className="text-red-500">{(error as ApiError).message || 'Error'}</p>}
          {!isLoading && !error && sessions.length === 0 && <p className={muted}>No sessions yet</p>}
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`rounded-lg border px-4 py-3 ${
                  theme === 'dark' ? 'border-slate-700 bg-slate-800/60 text-white' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="font-semibold">
                  {new Date(s.scheduledStartAt).toLocaleString()} → {new Date(s.scheduledEndAt).toLocaleString()}
                </p>
                <p className={`${muted} text-xs`}>{s.status}</p>
                {s.disputeFlaggedAt && (
                  <p className="text-xs text-red-500 mt-1">
                    {language === 'vi' ? 'Phiên này đang được xem xét' : 'Session flagged for review'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
