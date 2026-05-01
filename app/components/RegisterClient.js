"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterClient({ totalUsers }) {
  const router = useRouter();
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (!form.email.includes("@")) e.email = "Email tidak valid";
    if (form.password.length < 8) e.password = "Minimal 8 karakter";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (loading) return;

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        setErrors({ general: data.error || "Gagal register" });
        setLoading(false);
        return;
      }

      router.push("/plan");
    } catch {
      setErrors({ general: "Server error" });
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/plan" });
  };

  const passwordStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = passwordStrength(form.password);
  const strengthLabel = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#10b981", "#059669"][strength];

  if (step === "success") {
    return (
      <div
        style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
      >
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Akun berhasil dibuat!</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Selamat datang di Labain. Akun kamu sudah aktif dan siap digunakan.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Mulai Eksplorasi →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      className="min-h-screen bg-gray-50 flex flex-row-reverse"
    >
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-emerald-500 p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "white", transform: "translate(40%, -40%)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10" style={{ background: "white", transform: "translate(-40%, 40%)" }} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full opacity-5" style={{ background: "white", transform: "translate(-50%, -50%)" }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <img src="/labain.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-white/60 text-[10px] leading-none">Platform AI</p>
              <h1 className="text-white font-bold text-sm leading-tight">
                Lab<span className="text-emerald-200">AI</span>n
              </h1>
            </div>
          </div>

          <h2 className="text-white text-3xl font-bold leading-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
            Mulai gratis,<br />kembangkan lebih jauh
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Bergabung bersama{" "}
            <span className="text-white font-bold">{totalUsers}+</span>{" "}
            pelaku UMKM yang sudah menggunakan AI untuk tumbuh lebih cepat.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="relative z-10 space-y-3">
          {[
            "Caption Instagram & TikTok otomatis",
            "Foto produk profesional tanpa studio",
            "Logo usaha unik dalam hitungan detik",
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-white/80 text-sm">{f}</span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="relative z-10">
          <div className="flex -space-x-2 mb-3">
            {["A", "B", "C", "D"].map((l, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-emerald-500 bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {l}
              </div>
            ))}
          </div>
          <p className="text-white/60 text-xs">+{totalUsers} UMKM sudah bergabung</p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex items-center justify-start lg:justify-center px-6 py-12">
        <div className="w-full max-w-md lg:ml-12">

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
              Buat akun gratis
            </h2>
            <p className="text-sm text-gray-400">
              Bergabung dengan {totalUsers}+ pelaku UMKM Indonesia
            </p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm mb-5 disabled:opacity-60"
          >
            {googleLoading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? "Menghubungkan..." : "Daftar dengan Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 font-medium">atau dengan email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-xs font-medium px-4 py-3 rounded-xl">
                {errors.general}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Budi Santoso"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-300 outline-none transition-all bg-white
                  ${errors.name ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50" : "border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="budi@umkm.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-300 outline-none transition-all bg-white
                  ${errors.email ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50" : "border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 8 karakter"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm text-gray-800 placeholder-gray-300 outline-none transition-all bg-white
                    ${errors.password ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50" : "border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPass ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : "#f1f5f9" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strengthColor }}>
                    {strengthLabel}
                  </p>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-400 leading-relaxed">
              Dengan mendaftar, kamu menyetujui{" "}
              <Link href="/terms" className="text-emerald-600 hover:underline font-medium">Syarat & Ketentuan</Link>
              {" "}dan{" "}
              <Link href="/privacy" className="text-emerald-600 hover:underline font-medium">Kebijakan Privasi</Link> kami.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Membuat akun...
                </>
              ) : (
                "Buat Akun Gratis →"
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-emerald-600 font-bold hover:underline">
                Masuk sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}