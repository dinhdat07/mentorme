'use client';

import useSWR from 'swr';
import { apiClient, ApiError } from '@/lib/api-client';
import { useUISettings } from '@/components/ui-settings-context';
import { Bell } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';

type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
};

type NotificationResponse = {
  data: Notification[];
  total: number;
  unread: number;
};

export default function NotificationsPage() {
  const { theme, language } = useUISettings();
  const { data, error, mutate } = useSWR<NotificationResponse>('/api/notifications/me', apiClient.get);

  const markAll = async () => {
    await apiClient.patch('/api/notifications/read-all', {});
    mutate();
  };

  const markRead = async (id: string) => {
    await apiClient.patch(`/api/notifications/${id}/read`, {});
    mutate();
  };

  const text = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const muted = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const card = theme === 'dark' ? 'bg-slate-900/70 border border-slate-800' : 'bg-white border border-slate-200';

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-purple-500" />
          <div>
            <h1 className={`text-3xl font-bold ${text}`}>{language === 'vi' ? 'Thông báo' : 'Notifications'}</h1>
            <p className={muted}>{language === 'vi' ? 'Xem các thông báo mới nhất' : 'See your latest notifications'}</p>
          </div>
          <button
            onClick={markAll}
            className="ml-auto px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow"
          >
            {language === 'vi' ? 'Đánh dấu đã đọc' : 'Mark all read'}
          </button>
        </div>

        <div className={`rounded-xl p-6 ${card}`}>
          {error && <p className="text-red-500">{(error as ApiError).message || 'Error'}</p>}
          {!data && !error && <p className={muted}>Loading...</p>}
          {data && data.data.length === 0 && <p className={muted}>{language === 'vi' ? 'Chưa có thông báo' : 'No notifications yet'}</p>}
          <div className="space-y-3">
            {data?.data.map((n) => (
              <div
                key={n.id}
                className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
                  theme === 'dark' ? 'border-slate-700 bg-slate-800/60 text-white' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex-1">
                  <p className="font-semibold">{n.title}</p>
                  <p className={muted}>{n.body}</p>
                  <p className={`${muted} text-xs`}>{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.readAt && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-xs px-2 py-1 rounded-md border border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    {language === 'vi' ? 'Đánh dấu đã đọc' : 'Mark read'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
