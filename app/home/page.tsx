"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const services = [
  {
    title: "AI Caption Generator",
    desc: "Buat caption Instagram & promosi otomatis yang engaging",
    route: "/caption",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    accent: "#10b981",
    lightBg: "#ecfdf5",
    tag: "Social Media",
  },
  {
    title: "AI Business Profile",
    desc: "Profil usaha profesional untuk UMKM yang menarik investor",
    route: "/profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    accent: "#6366f1",
    lightBg: "#eef2ff",
    tag: "Branding",
  },
  {
	title: "AI Logo Usaha",
	desc: "Buat logo profesional & unik untuk brand UMKM-mu dalam hitungan detik",
	route: "/logo",
	icon: (
	  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
		<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
  ),
	accent: "#8b5cf6",
	lightBg: "#f5f3ff",
	tag: "Branding",
	isNew: true,
  },
  {
    title: "AI Product Photo",
    desc: "Generate foto produk profesional tanpa studio mahal",
    route: "/photo",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    accent: "#0ea5e9",
    lightBg: "#f0f9ff",
    tag: "Visual",
    isNew: true,
  },
];

const stats = [
  { label: "Pengguna Aktif", value: "12.4K", icon: "👥" },
  { label: "Konten Dibuat", value: "98K+", icon: "✨" },
  { label: "UMKM Terbantu", value: "3.200", icon: "🏪" },
  { label: "Hemat Waktu", value: "80%", icon: "⚡" },
];

export default function Home() {
  const router = useRouter();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-white border-b border-gray-100">
        {/* Decorative blobs */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10b981, transparent)" }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }}
        />

        <div className="relative max-w-5xl mx-auto px-8 py-14">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Platform AI untuk UMKM Indonesia
              </div>
              <h1
                className="text-4xl font-bold text-gray-900 leading-tight mb-3"
                style={{ letterSpacing: "-0.02em" }}
              >
                Kembangkan Usahamu<br />
                <span className="text-emerald-500">dengan Kecerdasan AI</span>
              </h1>
              <p className="text-gray-500 text-base max-w-lg leading-relaxed">
                Dari caption sosmed, foto produk, hingga ide bisnis — semua tersedia dalam satu platform yang dirancang khusus untuk UMKM.
              </p>
            </div>

            {/* Quick action */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 min-w-[220px]">
              <p className="text-xs text-gray-400 font-medium mb-1">Mulai cepat</p>
              <p className="text-sm font-semibold text-gray-700 mb-3">Apa yang kamu butuhkan hari ini?</p>
              <button
                onClick={() => router.push("/caption")}
                className="w-full text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Buat Caption →
              </button>
              <button
                onClick={() => router.push("/photo")}
                className="w-full text-sm bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-xl border border-gray-200 transition-colors mt-2"
              >
                Generate Foto Produk →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── SECTION TITLE ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Layanan AI</h2>
            <p className="text-sm text-gray-400 mt-0.5">Pilih tool yang sesuai kebutuhanmu</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{services.length} tools tersedia</span>
        </div>

        {/* ── SERVICE GRID ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <div
              key={i}
              onClick={() => router.push(s.route)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="group cursor-pointer bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
              style={{
                transform: hoveredIdx === i ? "translateY(-2px)" : "translateY(0)",
                transition: "transform 200ms ease, box-shadow 200ms ease",
              }}
            >
              {/* Subtle accent glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{
                  background: `radial-gradient(circle at top left, ${s.accent}08, transparent 60%)`,
                }}
              />

              {/* NEW badge */}
              {s.isNew && (
                <span
                  className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: s.accent + "18", color: s.accent }}
                >
                  NEW
                </span>
              )}

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: s.lightBg, color: s.accent }}
              >
                {s.icon}
              </div>

              {/* Tag */}
              <span
                className="text-[10px] font-semibold uppercase tracking-wider mb-2 block"
                style={{ color: s.accent }}
              >
                {s.tag}
              </span>

              <h3 className="text-base font-bold text-gray-800 mb-1.5 leading-snug">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">{s.desc}</p>

              {/* CTA */}
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-semibold group-hover:gap-2 transition-all"
                  style={{ color: s.accent }}
                >
                  Coba Sekarang
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background: hoveredIdx === i ? s.accent : s.lightBg,
                    color: hoveredIdx === i ? "white" : s.accent,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── FOOTER NOTE ── */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-300">
            © 2025 UMKM AI SaaS · Dibuat dengan ❤️ untuk pelaku usaha Indonesia
          </p>
        </div>
      </div>
    </div>
  );
}