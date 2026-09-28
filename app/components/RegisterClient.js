"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

/* Tujuan setelah daftar dengan Google. Halaman utama = asisten. */
const AFTER_GOOGLE = "/";

const highlights = [
  "Caption, foto produk, dan logo untuk promosi",
  "Catat penjualan dan hitung laba harian",
  "Hitung HPP dan harga jual yang aman",
];

const inputClass = (hasError) =>
  `w-full px-4 py-3 rounded-xl border text-sm text-gray-800 placeholder-gray-400 outline-none transition-all bg-white ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
  }`;

const Spinner = ({ size = 17, color = "currentColor" }) => (
  <svg
    className="animate-spin motion-reduce:animate-none"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

export default function RegisterClient({ totalUsers }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const busy = loading || googleLoading;
  const userCount = Number(totalUsers) || 0;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (!form.email.includes("@")) e.email = "Email tidak valid";
    if (form.password.length < 8) e.password = "Minimal 8 karakter";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy || !validate()) return;

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        setErrors({ general: data.error || "Gagal mendaftar. Coba lagi." });
        setLoading(false);
        return;
      }

      // Arahkan ke halaman cek email dulu
      router.push(`/check-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setErrors({ general: "Terjadi gangguan pada server. Coba lagi." });
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: AFTER_GOOGLE });
    } catch {
      setGoogleLoading(false);
      setErrors({ general: "Gagal terhubung ke Google. Coba lagi." });
    }
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
  const strengthLabel = ["", "Lemah", "Cukup", "Kuat", "Sangat kuat"][strength];
  const strengthColor = ["", "#dc2626", "#d97706", "#059669", "#047857"][strength];

  return (
    <div
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      className="min-h-screen bg-gray-50 flex flex-row-reverse"
    >
      {/* ── PANEL INFO ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-emerald-700 p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10" style={{ transform: "translate(40%, -40%)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/10" style={{ transform: "translate(-40%, 40%)" }} />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-12" aria-label="Labain, ke beranda">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <img src="/labain.png" alt="" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-white font-bold text-base">
              Lab<span className="text-emerald-200">AI</span>n
            </span>
          </Link>

          <h2 className="text-white text-3xl font-bold leading-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
            Punya usaha,
            <br />
            punya asisten.
          </h2>
          <p className="text-white/90 text-sm leading-relaxed">
            Ceritakan kebutuhan usahamu dengan bahasa sehari-hari. Labain
            membantu promosi, menghitung harga, dan mencatat keuangan.
          </p>
        </div>

        <ul className="relative z-10 space-y-3 list-none p-0 m-0">
          {highlights.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-white/90 text-sm">{f}</span>
            </li>
          ))}
        </ul>

        <div className="relative z-10">
          {userCount > 0 ? (
            <p className="text-white/80 text-xs">
              {userCount.toLocaleString("id-ID")} pelaku usaha sudah mendaftar
            </p>
          ) : (
            <p className="text-white/80 text-xs">Gratis untuk dicoba, tanpa kartu kredit.</p>
          )}
        </div>
      </div>

      {/* ── FORM ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:py-12">
        <div className="w-full max-w-md">
          {/* Logo untuk layar kecil (panel info disembunyikan) */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8" aria-label="Labain, ke beranda">
            <img src="/labain.png" alt="" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-gray-800">
              Lab<span className="text-emerald-600">AI</span>n
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ letterSpacing: "-0.02em" }}>
              Buat akun gratis
            </h1>
            <p className="text-sm text-gray-600">
              Simpan riwayat dan data usahamu, lalu lanjutkan kapan saja.
            </p>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm mb-5 disabled:opacity-60"
          >
            {googleLoading ? (
              <Spinner size={18} color="#059669" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? "Menghubungkan..." : "Daftar dengan Google"}
          </button>

          <div className="flex items-center gap-3 mb-5" aria-hidden="true">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium">atau dengan email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.general && (
              <div role="alert" className="bg-red-50 border border-red-100 text-red-700 text-xs font-medium px-4 py-3 rounded-xl">
                {errors.general}
              </div>
            )}

            {/* Nama */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nama lengkap
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Budi Santoso"
                value={form.name}
                onChange={setField("name")}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "reg-name-err" : undefined}
                className={inputClass(errors.name)}
              />
              {errors.name && <p id="reg-name-err" className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="budi@umkm.com"
                value={form.email}
                onChange={setField("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "reg-email-err" : undefined}
                className={inputClass(errors.email)}
              />
              {errors.email && <p id="reg-email-err" className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  value={form.password}
                  onChange={setField("password")}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "reg-password-err" : undefined}
                  className={`${inputClass(errors.password)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPass}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPass ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1" aria-hidden="true">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strengthColor }}>
                    Kekuatan password: {strengthLabel}
                  </p>
                </div>
              )}
              {errors.password && <p id="reg-password-err" className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Dengan mendaftar, kamu menyetujui{" "}
              <Link href="/terms" className="text-emerald-700 hover:underline font-medium">
                Syarat &amp; Ketentuan
              </Link>{" "}
              dan{" "}
              <Link href="/privacy" className="text-emerald-700 hover:underline font-medium">
                Kebijakan Privasi
              </Link>{" "}
              kami.
            </p>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Spinner />
                  Membuat akun...
                </>
              ) : (
                "Buat akun gratis"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-emerald-700 font-bold hover:underline">
                Masuk
              </Link>
            </p>
            <p className="mt-3 text-xs text-gray-500">
              Belum siap daftar?{" "}
              <Link href="/" className="text-emerald-700 hover:underline font-medium">
                Coba dulu tanpa login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}