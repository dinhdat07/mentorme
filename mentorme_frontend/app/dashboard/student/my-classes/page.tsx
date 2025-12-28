'use client';

import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useBookings } from '@/hooks/useBookings';
import { useUISettings } from '@/components/ui-settings-context';

export default function MyClassesPage() {
  const { bookings, isLoading } = useBookings();
  const { theme, language } = useUISettings();
  const text = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const muted = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const card = theme === 'dark' ? 'bg-slate-900/70 border border-slate-800' : 'bg-white border border-slate-200 shadow-sm';

  return (
    <DashboardLayout requiredRole={['STUDENT']}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className={`text-3xl font-bold ${text}`}>{language === 'vi' ? 'Lớp của tôi' : 'My Classes'}</h1>
          <p className={muted}>
            {language === 'vi' ? 'Danh sách lớp bạn đã đặt/đang học' : 'Classes you booked or are attending'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-10 w-10 border-b-2 border-purple-500 rounded-full" />
          </div>
        ) : bookings.length === 0 ? (
          <div className={`p-6 rounded-xl ${card}`}>
            <p className={muted}>{language === 'vi' ? 'Chưa có lớp nào' : 'No classes yet'}</p>
            <Link href="/tutors" className="inline-block mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {language === 'vi' ? 'Tìm gia sư' : 'Find tutors'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((bk) => (
              <div key={bk.id} className={`p-5 rounded-xl ${card}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <p className={`text-lg font-semibold ${text}`}>{bk.class?.title || 'Class'}</p>
                    <p className={muted}>{bk.class?.description}</p>
                    <p className="text-sm text-purple-500 font-semibold">{bk.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/classes/${bk.classId}`}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
                    >
                      {language === 'vi' ? 'Chi tiết lớp' : 'Class detail'}
                    </Link>
                    <Link
                      href={`/dashboard/student/classes/${bk.classId}/payment`}
                      className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm"
                    >
                      {language === 'vi' ? 'Thanh toán' : 'Payment'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
