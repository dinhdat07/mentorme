"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { SidebarNav } from "@/components/sidebar-nav";
import { useAuthContext } from "@/components/auth-provider";
import { apiClient, ApiError } from "@/lib/api-client";
import useSWR from "swr";
import { Class } from "@/lib/types";
import { useUISettings } from "@/components/ui-settings-context";

type ThemeMode = "dark" | "light";
type Language = "vi" | "en";

const translations: Record<Language, any> = {
  vi: {
    back: "← Quay lại",
    title: "Đặt lớp",
    trial: "Đây là lớp thử",
    hours: "Số giờ mỗi tuần *",
    slots: "Khung giờ mong muốn (có thể thêm nhiều, để trống nếu linh hoạt)",
    addSlot: "Thêm khung giờ",
    invalidSlot: "Khung giờ chưa đủ thông tin hoặc không hợp lệ",
    startDate: "Ngày bắt đầu *",
    message: "Lời nhắn cho gia sư",
    placeholder: "Chia sẻ nhu cầu, mục tiêu học tập...",
    booking: "Đang gửi yêu cầu...",
    submit: "Gửi yêu cầu",
    cancel: "Hủy",
    notFound: "Không tìm thấy lớp",
    classInfo: "Thông tin lớp",
  },
  en: {
    back: "← Back to Tutors",
    title: "Book Class",
    trial: "This is a trial class",
    hours: "Hours Per Week *",
    slots: "Preferred time slots (add multiple; leave empty if flexible)",
    addSlot: "Add slot",
    invalidSlot: "Please complete valid start/end times",
    startDate: "Start Date *",
    message: "Message to Tutor",
    placeholder: "Tell the tutor about your needs, goals, etc.",
    booking: "Booking...",
    submit: "Request Booking",
    cancel: "Cancel",
    notFound: "Class not found",
    classInfo: "Class Info",
  },
};

const themeStyles: Record<ThemeMode, Record<string, string>> = {
  dark: {
    page: "bg-slate-950",
    card: "glass rounded-xl backdrop-blur-md border border-white/15",
    infoCard: "bg-slate-900/80 border border-purple-500/30 rounded-xl p-4",
    label: "text-white/90",
    input:
      "w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all",
    select:
      "w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-slate-600 transition-all",
    heading: "text-3xl font-bold text-white mb-6",
    error: "bg-red-500/10 border border-red-500/40 text-red-200",
    btnPrimary:
      "flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition shadow-lg shadow-purple-500/30",
    btnGhost:
      "flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 px-4 rounded-lg transition",
    text: "text-white",
  },
  light: {
    page: "bg-slate-50",
    card: "bg-white rounded-xl border border-slate-200 shadow-sm",
    infoCard: "bg-slate-50 border border-purple-200 rounded-xl p-4",
    label: "text-slate-800",
    input:
      "w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-200 transition-all",
    select:
      "w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-200 transition-all",
    heading: "text-3xl font-bold text-slate-900 mb-6",
    error: "bg-red-50 border border-red-200 text-red-700",
    btnPrimary:
      "flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition shadow-sm",
    btnGhost:
      "flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg transition",
    text: "text-slate-900",
  },
};

export default function BookClassPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const { theme, language } = useUISettings();
  const styles = themeStyles[theme];
  const t = translations[language];
  const classId = params.id as string;

  const { data: classData, isLoading: classLoading } = useSWR<Class>(
    `/api/classes/${classId}`,
    apiClient.get
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    isTrial: false,
    requestedHoursPerWeek: 2,
    startDateExpected: new Date().toISOString().split("T")[0],
    noteFromStudent: "",
    slots: [{ dayOfWeek: 1, startTime: "", endTime: "" }],
  });

  const dayOptions = [
    { value: 0, vi: "Chủ nhật", en: "Sunday" },
    { value: 1, vi: "Thứ 2", en: "Monday" },
    { value: 2, vi: "Thứ 3", en: "Tuesday" },
    { value: 3, vi: "Thứ 4", en: "Wednesday" },
    { value: 4, vi: "Thứ 5", en: "Thursday" },
    { value: 5, vi: "Thứ 6", en: "Friday" },
    { value: 6, vi: "Thứ 7", en: "Saturday" },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "requestedHoursPerWeek" ? Number(value) : value,
      }));
    }
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map((v) => Number(v));
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIssues([]);
    setIsLoading(true);

    try {
      // Build preferred slots text (optional)
      const parsedSlots = formData.slots
        .map((slot) => {
          const start = slot.startTime;
          const end = slot.endTime;
          if (!start && !end) return null; // skip empty slot
          if (!start || !end) {
            throw new Error(t.invalidSlot);
          }
          const startMinute = timeToMinutes(start);
          const endMinute = timeToMinutes(end);
          if (
            Number.isNaN(startMinute) ||
            Number.isNaN(endMinute) ||
            endMinute <= startMinute
          ) {
            throw new Error(t.invalidSlot);
          }
          return {
            ...slot,
          };
        })
        .filter((s) => s !== null) as {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }[];

      let slotNote = "";
      if (parsedSlots.length > 0) {
        const label =
          language === "vi" ? "Khung giờ mong muốn" : "Preferred slots";
        const lines = parsedSlots.map((slot) => {
          const dayLabel =
            (language === "vi"
              ? dayOptions.find((d) => d.value === slot.dayOfWeek)?.vi
              : dayOptions.find((d) => d.value === slot.dayOfWeek)?.en) ||
            `Day ${slot.dayOfWeek}`;
          return `- ${dayLabel}: ${slot.startTime} - ${slot.endTime}`;
        });
        slotNote = `\n${label}:\n${lines.join("\n")}`;
      }

      const slot = parsedSlots[0]; // slot đầu tiên

      await apiClient.post("/api/bookings", {
        classId,
        isTrial: formData.isTrial,
        requestedHoursPerWeek: formData.requestedHoursPerWeek,
        startDateExpected: formData.startDateExpected,

        preferredSlot: {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },

        noteFromStudent: formData.noteFromStudent,
      });

      router.push("/dashboard/student/bookings");
    } catch (err: any) {
      if (err instanceof ApiError) {
        const issueMessages =
          err.data?.issues?.map((i: any) => {
            const path = Array.isArray(i.path) ? i.path.join(".") : "";
            return path ? `${path}: ${i.message}` : i.message;
          }) || [];
        setIssues(issueMessages);
        setError(err.message || "Failed to create booking");
      } else {
        setError(err.message || "Failed to create booking");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex h-screen ${styles.page}`}>
      <SidebarNav />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Link
            href="/tutors"
            className="text-purple-500 hover:underline mb-6 inline-block"
          >
            {t.back}
          </Link>

          <h1 className={styles.heading}>{t.title}</h1>

          {classLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
            </div>
          ) : classData ? (
            <form
              onSubmit={handleSubmit}
              className={`${styles.card} p-8 max-w-2xl`}
            >
              <div className="space-y-6">
                {error && (
                  <div
                    className={`${styles.error} px-4 py-3 rounded space-y-2`}
                  >
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

                {/* Class Info */}
                <div className={styles.infoCard}>
                  <h2 className={`text-lg font-bold mb-2 ${styles.text}`}>
                    {t.classInfo}
                  </h2>
                  <p className={`text-base font-semibold mb-1 ${styles.text}`}>
                    {classData.title}
                  </p>
                  <p className={`mb-2 ${styles.text}`}>
                    {classData.description}
                  </p>
                  <p className="font-semibold text-purple-500">
                    {classData.pricePerHour.toLocaleString("vi-VN")} ₫/giờ
                  </p>
                </div>

                <div>
                  <label className={`flex items-center gap-2 ${styles.label}`}>
                    <input
                      type="checkbox"
                      name="isTrial"
                      checked={formData.isTrial}
                      onChange={handleChange}
                      className="rounded accent-purple-500"
                    />
                    <span>{t.trial}</span>
                  </label>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${styles.label}`}
                  >
                    {t.hours}
                  </label>
                  <select
                    name="requestedHoursPerWeek"
                    value={formData.requestedHoursPerWeek}
                    onChange={handleChange}
                    className={styles.select}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                      <option key={hours} value={hours}>
                        {hours}{" "}
                        {language === "vi"
                          ? "giờ/tuần"
                          : `hour${hours > 1 ? "s" : ""} per week`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label
                      className={`block text-sm font-medium ${styles.label}`}
                    >
                      {t.slots}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          slots: [
                            ...prev.slots,
                            { dayOfWeek: 1, startTime: "", endTime: "" },
                          ],
                        }))
                      }
                      className="text-xs px-3 py-1 rounded-md border border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      {t.addSlot}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.slots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-3 gap-2 items-center"
                      >
                        <select
                          value={slot.dayOfWeek}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const next = [...prev.slots];
                              next[idx] = {
                                ...next[idx],
                                dayOfWeek: Number(e.target.value),
                              };
                              return { ...prev, slots: next };
                            })
                          }
                          className={styles.select}
                        >
                          {dayOptions.map((day) => (
                            <option key={day.value} value={day.value}>
                              {language === "vi" ? day.vi : day.en}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const next = [...prev.slots];
                              next[idx] = {
                                ...next[idx],
                                startTime: e.target.value,
                              };
                              return { ...prev, slots: next };
                            })
                          }
                          className={styles.input}
                        />
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              setFormData((prev) => {
                                const next = [...prev.slots];
                                next[idx] = {
                                  ...next[idx],
                                  endTime: e.target.value,
                                };
                                return { ...prev, slots: next };
                              })
                            }
                            className={styles.input}
                          />
                          {formData.slots.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  slots: prev.slots.filter(
                                    (_, sIdx) => sIdx !== idx
                                  ),
                                }))
                              }
                              className="text-xs px-2 py-1 rounded-md border border-red-300 text-red-500 hover:bg-red-50"
                            >
                              X
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${styles.label}`}
                  >
                    {t.startDate}
                  </label>
                  <input
                    type="date"
                    name="startDateExpected"
                    value={formData.startDateExpected}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${styles.label}`}
                  >
                    {t.message}
                  </label>
                  <textarea
                    name="noteFromStudent"
                    value={formData.noteFromStudent}
                    onChange={handleChange}
                    placeholder={t.placeholder}
                    rows={4}
                    className={`${styles.input} resize-none`}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={styles.btnPrimary}
                  >
                    {isLoading ? t.booking : t.submit}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className={styles.btnGhost}
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className={`${styles.card} p-12 text-center`}>
              <p className={`${styles.text} text-lg mb-4`}>{t.notFound}</p>
              <Link href="/tutors" className="text-purple-500 hover:underline">
                {t.back}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
