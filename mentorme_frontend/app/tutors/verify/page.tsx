'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/auth-provider';
import { getToken } from '@/lib/api-client';
import { ShieldCheck, UploadCloud, IdCard, AlertTriangle, CheckCircle2 } from 'lucide-react';

type SubmitState = 'IDLE' | 'SUBMITTING' | 'SUBMITTED';

export default function TutorVerifyPage() {
  const router = useRouter();
  const { user, tutorProfile, isLoading, isAuthenticated } = useAuthContext();

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000',
    []
  );

  const [submitState, setSubmitState] = useState<SubmitState>('IDLE');
  const [error, setError] = useState<string>('');

  const [fields, setFields] = useState({
    citizenIdNumber: '',
    fullNameOnId: '',
    dob: '',
    addressOnId: '',
  });

  const [files, setFiles] = useState<{
    idFront: File | null;
    idBack: File | null;
    selfie: File | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null,
  });

  const isTutor = user?.role === 'TUTOR';
  const isApproved = isTutor && user?.status === 'ACTIVE' && !!tutorProfile?.verified;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return; // ProtectedRoute sẽ xử lý

    // Không phải tutor => đưa về dashboard phù hợp
    if (user?.role && user.role !== 'TUTOR') {
      router.replace(`/dashboard/${user.role === 'ADMIN' ? 'admin' : 'student'}`);
      return;
    }

    // Đã duyệt => vào dashboard tutor
    if (isApproved) {
      router.replace('/dashboard/tutor');
    }
  }, [isLoading, isAuthenticated, user?.role, isApproved, router]);

  const onChangeField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((p) => ({ ...p, [name]: value }));
  };

  const onChangeFile = (key: 'idFront' | 'idBack' | 'selfie', file?: File | null) => {
    setFiles((p) => ({ ...p, [key]: file ?? null }));
  };

  async function submitKyc() {
    setError('');

    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    if (!fields.citizenIdNumber.trim() || !fields.fullNameOnId.trim()) {
      setError('Vui lòng nhập Số CCCD và Họ tên trên CCCD.');
      return;
    }
    if (!files.idFront || !files.idBack || !files.selfie) {
      setError('Vui lòng tải lên đủ 3 ảnh: mặt trước, mặt sau và ảnh selfie cầm CCCD.');
      return;
    }

    const form = new FormData();
    const cccd = fields.citizenIdNumber.trim();

    if (cccd.length < 9) {
    setError("Số CCCD phải có ít nhất 9 ký tự.");
    return;
    }

    form.append("citizenIdNumber", cccd);
    form.append('fullNameOnId', fields.fullNameOnId.trim());
    if (fields.dob) form.append('dob', fields.dob); // yyyy-mm-dd
    if (fields.addressOnId) form.append('addressOnId', fields.addressOnId.trim());

    form.append('idFront', files.idFront);
    form.append('idBack', files.idBack);
    form.append('selfie', files.selfie);

    const candidates = [
    '/api/tutors/verification/submit',
    ];



    let lastErr: any = null;

    for (const path of candidates) {
      try {
        const res = await fetch(`${apiBase}${path}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // KHÔNG set Content-Type khi dùng FormData
          },
          body: form,
        });

        // nếu endpoint không tồn tại, thử endpoint tiếp theo
        if (res.status === 404) {
          lastErr = new Error(`Endpoint not found: ${path}`);
          continue;
        }

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = data?.message || `Gửi xác minh thất bại (HTTP ${res.status})`;
          throw new Error(msg);
        }

        setSubmitState('SUBMITTED');
        return;
      } catch (e: any) {
        lastErr = e;
      }
    }

    setError(
      lastErr?.message ||
        'Gửi xác minh thất bại. Vui lòng kiểm tra endpoint backend.'
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === 'SUBMITTING') return;

    setSubmitState('SUBMITTING');
    try {
      await submitKyc();
    } finally {
      // nếu thành công thì state đã được set SUBMITTED ở trên
      setSubmitState((s) => (s === 'SUBMITTED' ? 'SUBMITTED' : 'IDLE'));
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Nếu không phải tutor / đã approved thì useEffect sẽ redirect; render tạm null
  if (!isTutor || isApproved) return null;

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl glass rounded-2xl border border-white/30 bg-white/20 backdrop-blur-xl shadow-2xl p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Xác minh Căn cước công dân
            </h1>
            <p className="text-white/80 mt-1">
              Bạn cần xác minh CCCD để mở khóa các chức năng gia sư (tạo lớp, nhận booking...).
            </p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 border border-white/25 bg-white/10 text-white/90 text-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-300" />
              Trạng thái: Chưa được duyệt
            </div>
          </div>
        </div>

        {submitState === 'SUBMITTED' ? (
          <div className="rounded-xl border border-green-400/40 bg-green-500/15 p-5 text-white">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Đã gửi hồ sơ xác minh!
            </div>
            <p className="text-white/80 mt-2">
              Hồ sơ của bạn đang chờ quản trị viên duyệt. Bạn vẫn có thể đăng nhập và theo dõi trạng thái.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.replace('/dashboard/tutor')}
                className="px-4 py-2 rounded-lg bg-white text-gray-900 font-semibold hover:bg-purple-50 transition"
              >
                Vào dashboard
              </button>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/25 text-white hover:bg-white/15 transition"
              >
                Tải lại trạng thái
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/15 p-4 text-red-100 flex gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <div className="font-semibold">Có lỗi</div>
                  <div className="text-sm mt-1">{error}</div>
                  <div className="text-xs mt-2 text-red-100/80">
                    Nếu bạn chưa tạo API upload CCCD ở backend, hãy tạo endpoint:
                    <span className="font-mono"> /api/tutor/verification/submit </span>
                    (hoặc
                    <span className="font-mono"> /api/auth/tutor/verification/submit</span>)
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Số CCCD <span className="text-red-200">*</span>
                </label>
                <div className="relative group">
                  <IdCard className="absolute left-3 top-3 w-5 h-5 text-purple-200/70" />
                  <input
                    name="citizenIdNumber"
                    value={fields.citizenIdNumber}
                    onChange={onChangeField}
                    className="w-full pl-10 pr-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="012345678901"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Họ tên trên CCCD <span className="text-red-200">*</span>
                </label>
                <input
                  name="fullNameOnId"
                  value={fields.fullNameOnId}
                  onChange={onChangeField}
                  className="w-full px-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="NGUYEN VAN A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Ngày sinh</label>
                <input
                  type="date"
                  name="dob"
                  value={fields.dob}
                  onChange={onChangeField}
                  className="w-full px-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Địa chỉ trên CCCD</label>
                <input
                  name="addressOnId"
                  value={fields.addressOnId}
                  onChange={onChangeField}
                  className="w-full px-4 py-3 bg-white/15 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Số nhà, phường/xã, quận/huyện, tỉnh/thành..."
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/25 bg-white/10 p-4">
              <div className="flex items-center gap-2 text-white font-semibold mb-3">
                <UploadCloud className="w-5 h-5" />
                Ảnh xác minh (bắt buộc)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FilePick
                  label="CCCD mặt trước"
                  hint="Ảnh rõ nét, không lóa"
                  onPick={(f) => onChangeFile('idFront', f)}
                  pickedName={files.idFront?.name ?? ''}
                />
                <FilePick
                  label="CCCD mặt sau"
                  hint="Không che góc ảnh"
                  onPick={(f) => onChangeFile('idBack', f)}
                  pickedName={files.idBack?.name ?? ''}
                />
                <FilePick
                  label="Selfie cầm CCCD"
                  hint="Thấy rõ mặt + CCCD"
                  onPick={(f) => onChangeFile('selfie', f)}
                  pickedName={files.selfie?.name ?? ''}
                />
              </div>

              <p className="text-xs text-white/70 mt-3">
                Lưu ý: Đây là dữ liệu nhạy cảm. Chỉ quản trị viên mới được xem để duyệt hồ sơ.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitState === 'SUBMITTING'}
              className="w-full btn-gradient text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitState === 'SUBMITTING' ? 'Đang gửi...' : 'Gửi xác minh'}
            </button>

            <div className="text-sm text-white/70">
              Sau khi gửi, hồ sơ sẽ ở trạng thái <b>chờ duyệt</b>. Bạn sẽ được mở khóa tính năng sau khi admin phê duyệt.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function FilePick({
  label,
  hint,
  pickedName,
  onPick,
}: {
  label: string;
  hint: string;
  pickedName: string;
  onPick: (file: File | null) => void;
}) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-3">
      <div className="text-white font-semibold text-sm">{label}</div>
      <div className="text-white/70 text-xs mt-1">{hint}</div>

      <label className="mt-3 inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-white/10 border border-white/25 text-white hover:bg-white/15 transition cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        Chọn ảnh
      </label>

      <div className="text-xs text-white/70 mt-2 break-words">
        {pickedName ? `Đã chọn: ${pickedName}` : 'Chưa chọn file'}
      </div>
    </div>
  );
}
