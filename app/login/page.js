"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    {open ? (
      <>
        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
          stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      </>
    ) : (
      <>
        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
          stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </>
    )}
  </svg>
);

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowResend(false);
    setResendSuccess("");

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      // NextAuth membungkus error dalam format berbeda, cek keduanya
      const msg = res.error;

      if (msg.includes("belum diverifikasi") || msg === "Email belum diverifikasi") {
        setError("Email belum diverifikasi. Cek inbox atau spam kamu.");
        setShowResend(true);
      } else if (msg.includes("tidak ditemukan") || msg === "Email tidak ditemukan") {
        setError("Email tidak terdaftar.");
      } else if (msg.includes("Password salah") || msg === "Password salah") {
        setError("Password salah.");
      } else if (msg.includes("Google") || msg === "Gunakan login Google") {
        setError("Akun ini terdaftar via Google. Gunakan tombol 'Masuk dengan Google'.");
      } else {
        setError("Email atau password salah.");
      }
      return;
    }

    router.push("/");
  };

  const handleResend = async () => {
    if (!form.email) {
      setError("Masukkan email kamu terlebih dahulu.");
      return;
    }
    setResendLoading(true);
    setResendSuccess("");

    try {
      const res = await fetch("/api/resend-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      if (res.ok) {
        setResendSuccess("Email verifikasi berhasil dikirim ulang! Cek inbox kamu.");
        setShowResend(false);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal mengirim ulang email. Coba lagi.");
      }
    } catch {
      setError("Gagal mengirim ulang email. Coba lagi.");
    }

    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-8">

        {/* Logo + judul */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2">
            <img
              src="/labain.png"
              alt="Logo LabAIn"
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-xl font-bold text-gray-800">
              Lab<span className="text-emerald-600">AI</span>n
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">Masuk ke akun Anda</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v5M10 14v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Resend verifikasi */}
        {showResend && (
          <div className="mb-3 text-center">
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2 disabled:opacity-50 transition"
            >
              {resendLoading ? "Mengirim..." : "Kirim ulang email verifikasi →"}
            </button>
          </div>
        )}

        {/* Resend success */}
        {resendSuccess && (
          <div className="mb-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-xl">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{resendSuccess}</span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-3">
          {/* Email */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <EmailIcon />
            </span>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <LockIcon />
            </span>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <EyeIcon open={showPass} />
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition mt-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Masuk...
              </span>
            ) : "Masuk"}
          </button>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Masuk dengan Google
        </button>

        {/* Daftar */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Belum punya akun?{" "}
          <Link href="/register" className="text-emerald-600 font-semibold hover:text-emerald-700">
            Daftar sekarang
          </Link>
        </p>

      </div>
    </div>
  );
}