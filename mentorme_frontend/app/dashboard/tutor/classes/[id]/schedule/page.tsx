'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient, ApiError } from '@/lib/api-client';
import { useUISettings } from '@/components/ui-settings-context';
import { PaymentSummary, Session } from '@/lib/types';

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
  if (!time) return 0;
  const [h, m] = time.split(':').map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
};

const minutesToTime = (mins?: number) => {
  if (mins === undefined || mins === null || Number.isNaN(mins)) return '00:00';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const formatUtcToTz = (iso: string, tz: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = formatter.formatToParts(new Date(iso)).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
};

const getOffsetMinutes = (date: Date, timeZone: string) => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - date.getTime()) / 60000;
};

const localDateTimeToUtcIso = (date: string, time: string, timeZone: string) => {
  if (!date || !time) return null;
  const [y, m, d] = date.split('-').map((v) => parseInt(v, 10));
  const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const baseUtcMs = Date.UTC(y, (m || 1) - 1, d, hh, mm, 0);
  const offset = getOffsetMinutes(new Date(baseUtcMs), timeZone);
  return new Date(baseUtcMs - offset * 60_000).toISOString();
};

export default function ClassSchedulePage() {
  const params = useParams<{ id: string }>();
  const classId = params?.id;
  const { theme, language } = useUISettings();
  const { data, error, isLoading, mutate } = useSWR<ScheduleResponse>(
    classId ? `/api/classes/${classId}/schedule` : null,
    apiClient.get
  );
  const { data: paymentSummary, mutate: refreshPayments } = useSWR<PaymentSummary>(
    classId ? `/api/classes/${classId}/payments/summary` : null,
    apiClient.get
  );

  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [startDate, setStartDate] = useState('');
  const [weeks, setWeeks] = useState(4);
  const [slots, setSlots] = useState([{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }]);
  const [explicit, setExplicit] = useState([{ startDate: '', startTime: '', endTime: '' }]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const muted = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const card = theme === 'dark' ? 'bg-slate-900/70 border border-slate-800' : 'bg-white border border-slate-200';
  const labelColor = theme === 'dark' ? 'text-slate-200' : 'text-slate-700';
  const inputClass =
    theme === 'dark'
      ? 'w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500'
      : 'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900';
  const buttonPrimary =
    theme === 'dark'
      ? 'px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:from-purple-400 hover:to-pink-400'
      : 'px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow';
  const buttonDanger =
    theme === 'dark'
      ? 'px-4 py-3 rounded-lg border border-red-400 text-red-100 bg-red-500/10 hover:bg-red-500/20 font-semibold'
      : 'px-4 py-3 rounded-lg border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 font-semibold';
  const buttonGhost =
    theme === 'dark'
      ? 'text-sm text-purple-100'
      : 'text-sm text-purple-600';

  const submitLabel = language === 'vi' ? 'Lưu lịch' : 'Save schedule';

  const handleSlotChange = (idx: number, key: string, val: any) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));
  };

  const handleExplicitChange = (idx: number, key: string, val: any) => {
    setExplicit((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));
  };

  const addSlot = () => setSlots((prev) => [...prev, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }]);
  const addExplicit = () =>
    setExplicit((prev) => [...prev, { startDate: '', startTime: '', endTime: '' }]);

  useEffect(() => {
    if (!data?.schedule) return;
    if (data.schedule.timezone) setTimezone(data.schedule.timezone);
    const rule = data.schedule.recurrenceRule;
    if (rule) {
      const parsedStart = (rule.startDate || '').split('T')[0] || '';
      setStartDate(parsedStart);
      setWeeks(rule.weeks || 1);
      if (Array.isArray(rule.slots) && rule.slots.length > 0) {
        setSlots(
          rule.slots.map((s: any) => ({
            dayOfWeek: Number(s.dayOfWeek ?? 0),
            startTime: minutesToTime(Number(s.startMinute ?? 0)),
            endTime: minutesToTime(Number(s.endMinute ?? 0)),
          }))
        );
      }
    }
    if (data.schedule.explicitSessions && Array.isArray(data.schedule.explicitSessions)) {
      setExplicit(
        data.schedule.explicitSessions.map((s: any) => {
          const { date, time } = formatUtcToTz(s.startAt ?? s.start, data.schedule?.timezone || 'Asia/Ho_Chi_Minh');
          const end = formatUtcToTz(s.endAt ?? s.end, data.schedule?.timezone || 'Asia/Ho_Chi_Minh');
          return { startDate: date, startTime: time, endTime: end.time };
        })
      );
    }
  }, [data]);

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
        .map((s) => {
          const startAt = localDateTimeToUtcIso(s.startDate, s.startTime, payload.timezone);
          const endAt = localDateTimeToUtcIso(s.startDate, s.endTime, payload.timezone);
          return { startAt, endAt };
        })
        .filter((s) => !!s.startAt && !!s.endAt)
        .filter((s) => new Date(s.endAt as string) > new Date(s.startAt as string));

      const payload: any = { timezone: timezone?.trim() || 'Asia/Ho_Chi_Minh' };
      if (slotPayload.length > 0 && !startDate) {
        setSubmitError(language === 'vi' ? 'Vui lòng chọn ngày bắt đầu cho lịch lặp tuần' : 'Please choose a start date for weekly recurrence');
        setSubmitting(false);
        return;
      }
      if (startDate && slotPayload.length > 0) {
        const startIso = `${startDate}T00:00:00`;
        payload.recurrence = {
          startDate: startIso,
          weeks: weeks || 1,
          slots: slotPayload,
        };
      }
      if (explicitPayload.length > 0) {
        payload.explicitSessions = explicitPayload;
      }

      await apiClient.post(`/api/classes/${classId}/schedule`, payload);
      mutate();
      refreshPayments();
    } catch (err) {
      const apiErr = err as ApiError;
      setSubmitError(apiErr?.message || 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!classId) return;
    if (!confirm(language === 'vi' ? 'Xóa toàn bộ lịch lớp này?' : 'Delete all schedule for this class?')) return;
    setDeleting(true);
    setSubmitError(null);
    try {
      await apiClient.delete(`/api/classes/${classId}/schedule`);
      mutate();
      refreshPayments();
    } catch (err) {
      const apiErr = err as ApiError;
      setSubmitError(apiErr?.message || 'Failed to delete schedule');
    } finally {
      setDeleting(false);
    }
  };

  const sessions = useMemo(() => data?.sessions || [], [data]);
  const progressLabel =
    data && data.class
      ? `${data.class.sessionsCompleted || 0}/${data.class.totalSessions || data.schedule?.totalSessions || sessions.length} (${data.class.lifecycleStatus || ''})`
      : '';
  const displayTz = data?.schedule?.timezone || timezone || 'Asia/Ho_Chi_Minh';

  return (
    <DashboardLayout requiredRole={['TUTOR']}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className={`text-3xl font-bold ${textColor}`}>{language === 'vi' ? 'Lịch & thanh toán lớp học' : 'Class schedule & payments'}</h1>
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
                className={`${inputClass}`}
              />
            </div>
            <div>
              <label className={`text-sm font-semibold block mb-1 ${labelColor}`}>{language === 'vi' ? 'Ngày bắt đầu tuần' : 'Week start date'}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`${inputClass}`}
              />
            </div>
            <div>
              <label className={`text-sm font-semibold block mb-1 ${labelColor}`}>{language === 'vi' ? 'Số tuần' : 'Weeks'}</label>
              <input
                type="number"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(parseInt(e.target.value, 10) || 1)}
                className={`${inputClass}`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className={`font-semibold ${textColor}`}>{language === 'vi' ? 'Lặp tuần' : 'Weekly recurrence'}</h2>
              <button type="button" onClick={addSlot} className={buttonGhost}>
                + Slot
              </button>
            </div>
            <div className="space-y-2">
              {slots.map((s, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2">
                  <select
                    value={s.dayOfWeek}
                    onChange={(e) => handleSlotChange(idx, 'dayOfWeek', parseInt(e.target.value, 10))}
                    className={`${inputClass}`}
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
                    className={`${inputClass}`}
                  />
                  <input
                    type="time"
                    value={s.endTime}
                    onChange={(e) => handleSlotChange(idx, 'endTime', e.target.value)}
                    className={`${inputClass}`}
                  />
                </div>
              ))}
            </div>
          </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className={`font-semibold ${textColor}`}>{language === 'vi' ? 'Buổi cụ thể' : 'Explicit sessions'}</h2>
                <button type="button" onClick={addExplicit} className={buttonGhost}>
                  + Session
                </button>
              </div>
              <div className="space-y-2">
                {explicit.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2">
                    <input
                      type="date"
                      value={s.startDate}
                      onChange={(e) => handleExplicitChange(idx, 'startDate', e.target.value)}
                      className={`${inputClass}`}
                    />
                    <input
                      type="time"
                      value={s.startTime}
                      onChange={(e) => handleExplicitChange(idx, 'startTime', e.target.value)}
                      className={`${inputClass}`}
                    />
                    <input
                      type="time"
                      value={s.endTime}
                      onChange={(e) => handleExplicitChange(idx, 'endTime', e.target.value)}
                      className={`${inputClass}`}
                    />
                  </div>
                ))}
              </div>
            </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={submitting}
              className={buttonPrimary}
            >
              {submitting ? '...' : submitLabel}
            </button>
            <button
              type="button"
              onClick={handleDeleteSchedule}
              disabled={deleting}
              className={buttonDanger}
            >
              {deleting ? '...' : language === 'vi' ? 'Xóa lịch' : 'Delete schedule'}
            </button>
          </div>
        </form>

        <div className={`rounded-xl p-6 ${card}`}>
          <h3 className={`text-xl font-semibold mb-2 ${textColor}`}>{language === 'vi' ? 'Các buổi đã tạo' : 'Generated sessions'}</h3>
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
                  {new Date(s.scheduledStartAt).toLocaleString('vi-VN', {
                    timeZone: displayTz,
                    dateStyle: 'short',
                    timeStyle: 'short',
                    hour12: false,
                  })}{' '}
                  →{' '}
                  {new Date(s.scheduledEndAt).toLocaleString('vi-VN', {
                    timeZone: displayTz,
                    dateStyle: 'short',
                    timeStyle: 'short',
                    hour12: false,
                  })}
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

        <div className={`rounded-xl p-6 ${card}`}>
          <h3 className={`text-xl font-semibold mb-2 ${textColor}`}>{language === 'vi' ? 'Thanh toán ký quỹ' : 'Escrow payments'}</h3>
          {!paymentSummary ? (
            <p className={muted}>{language === 'vi' ? 'Đang tải...' : 'Loading...'}</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200">
                  <p className="text-sm font-semibold text-purple-600">{language === 'vi' ? 'Số dư khả dụng' : 'Available'}</p>
                  <p className="text-lg font-bold text-purple-700">
                    {paymentSummary.escrow.availableBalance.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-600">{language === 'vi' ? 'Đã giải ngân' : 'Released'}</p>
                  <p className="text-lg font-bold text-slate-800">
                    {paymentSummary.escrow.releasedAmount.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>
              <p className={muted}>
                {language === 'vi'
                  ? `Buổi hoàn tất chưa thanh toán: ${paymentSummary.unpaidCompleted}`
                  : `Unpaid completed sessions: ${paymentSummary.unpaidCompleted}`}
              </p>
              <div className="space-y-2">
                {paymentSummary.ledger.length === 0 && <p className={muted}>No ledger entries yet</p>}
                {paymentSummary.ledger.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-lg border px-4 py-2 ${
                      theme === 'dark' ? 'border-slate-700 bg-slate-800/60 text-white' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{entry.type}</span>
                      <span className="text-sm">{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">
                      {entry.amount.toLocaleString('vi-VN')} ₫ {entry.sessionId ? `(session ${entry.sessionId.slice(0, 6)})` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
