"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "emailmu";

  return (
    <div
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Cek emailmu!</h2>
        <p className="text-sm text-gray-400 mb-1 leading-relaxed">
          Kami mengirim link verifikasi ke
        </p>
        <p className="text-sm font-semibold text-gray-700 mb-6 break-all">{email}</p>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Klik link di email tersebut untuk mengaktifkan akunmu. Cek folder{" "}
          <span className="font-medium text-gray-500">Spam</span> jika tidak muncul dalam beberapa menit.
        </p>

        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm mb-3"
        >
          Buka Gmail
        </a>

        <button
          onClick={() => router.push("/login")}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
        >
          Sudah verifikasi?{" "}
          <span className="text-emerald-600 font-semibold">Masuk sekarang</span>
        </button>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}