"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  // Auto redirect ke login setelah 4 detik
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => router.push("/login"), 4000);
      return () => clearTimeout(t);
    }
  }, [success, router]);

  if (error) {
    return (
      <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link kadaluarsa</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Link verifikasi sudah tidak valid atau telah kadaluarsa. Silakan daftar ulang.
          </p>
          <button
            onClick={() => router.push("/register")}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Daftar Ulang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center">

        {/* Animated checkmark */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5"
          style={{ animation: "pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Email berhasil diverifikasi!</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Akunmu sudah aktif. Kamu akan diarahkan ke halaman login dalam beberapa detik...
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1 mb-6 overflow-hidden">
          <div
            className="h-1 bg-emerald-500 rounded-full"
            style={{ animation: "progress 4s linear forwards" }}
          />
        </div>

        <button
          onClick={() => router.push("/login")}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          Masuk Sekarang
        </button>

        <style jsx>{`
          @keyframes pop {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}