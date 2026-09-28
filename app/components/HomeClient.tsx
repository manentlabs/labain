"use client";

import { useRef, useState } from "react";
import Link from "next/link";

/* ---------------------------------------------------------
   KONFIGURASI
   - MAX_DEMO_TURNS : jumlah pesan di mode coba (samakan dengan server).
---------------------------------------------------------- */
const MAX_DEMO_TURNS = 6;

type Msg = { role: "user" | "assistant"; content: string };

type Stat = { label: string; value: string; icon: string };

/* Tiap pilar punya alat (chip) dengan contoh permintaannya sendiri. */
const pillars = [
  {
    title: "Pemasaran",
    desc: "Caption, foto produk, logo, dan profil usaha, semuanya dari satu percakapan.",
    example: "Buatkan caption Instagram untuk keripik pisang saya",
    tools: [
      { label: "Caption", prompt: "Buatkan caption Instagram untuk keripik pisang saya" },
      { label: "Foto produk", prompt: "Buatkan foto produk yang menarik untuk jualan saya" },
      { label: "Logo", prompt: "Buatkan logo untuk usaha keripik pisang saya" },
      { label: "Profil usaha", prompt: "Buatkan profil usaha untuk toko keripik pisang saya" },
    ],
    available: true,
    accent: "#059669",
    lightBg: "#ecfdf5",
    path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    title: "Catat keuangan",
    desc: "Ceritakan penjualan dan biaya hari ini. Labain mencatat dan menghitung labanya.",
    example: "Hari ini jual 40 bungkus @Rp15.000, biaya produksi Rp350.000",
    tools: [
      { label: "Penjualan", prompt: "Hari ini saya jual 40 bungkus keripik @Rp15.000" },
      { label: "Biaya", prompt: "Hari ini belanja bahan Rp300.000 dan bayar pegawai Rp100.000" },
      { label: "Laba harian", prompt: "Berapa laba saya hari ini?" },
    ],
    available: true,
    accent: "#0369a1",
    lightBg: "#f0f9ff",
    path: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  },
  {
    title: "Harga & HPP",
    desc: "Hitung modal, margin, dan harga jual yang aman dari biaya nyata usahamu.",
    example: "Hitung harga jual keripik pisang, modal per bungkus Rp8.000",
    tools: [
      { label: "HPP", prompt: "Hitung HPP keripik pisang saya" },
      { label: "Margin", prompt: "Berapa margin kalau saya jual Rp15.000 per bungkus?" },
      { label: "Titik impas", prompt: "Berapa bungkus yang harus terjual agar balik modal?" },
    ],
    available: true,
    accent: "#7c3aed",
    lightBg: "#f5f3ff",
    path: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  },
];

const suggestions = [
  "Buat caption untuk produk saya",
  "Hitung harga jual produk saya",
  "Bantu promosi usaha saya",
];

const steps = [
  { title: "Ceritakan kebutuhanmu", desc: "Tulis dengan bahasa biasa. Tidak perlu memahami istilah AI.", style: "bg-emerald-50 text-emerald-700" },
  { title: "Labain memahami", desc: "AI memahami usahamu lalu memilih alat yang sesuai: caption, hitungan, atau catatan.", style: "bg-indigo-50 text-indigo-700" },
  { title: "Dapatkan hasilnya", desc: "Hasil siap pakai. Masuk untuk menyimpan data dan riwayat usahamu.", style: "bg-purple-50 text-purple-700" },
];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

export default function HomeClient({ stats }: { stats: Stat[] }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const limitReached = userTurns >= MAX_DEMO_TURNS;

  async function runDemo() {
    const q = prompt.trim();
    if (!q || loading || limitReached) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setPrompt("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan. Coba lagi.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      // Kembalikan pesan ke kotak supaya bisa dikirim ulang.
      setMessages(messages);
      setPrompt(q);
      setError(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function resetDemo() {
    setMessages([]);
    setError("");
    setPrompt("");
  }

  // Kartu dan chip mengisi kotak chat, bukan pindah halaman.
  function fillPrompt(text: string) {
    setPrompt(text);
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <main className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[380px] h-[380px] rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-12 md:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">

            {/* ---------- KIRI: kalimat pembuka ---------- */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3.5 py-2 rounded-full border border-emerald-100 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                Platform AI untuk UMKM Indonesia
              </div>

              <h1
                className="text-4xl lg:text-[44px] font-bold text-gray-900 leading-[1.1] mb-4"
                style={{ letterSpacing: "-0.035em" }}
              >
                Lab<span className="text-emerald-700">AI</span>n: Biar AI yang kerja,
                <br />
                <span className="text-emerald-700">Anda fokus naik kelas.</span>
              </h1>

              <p className="text-lg font-medium text-gray-700 mb-2">
                Satu Klik untuk Digitalisasi Bisnis Anda.
              </p>

              <p className="text-base text-gray-600 leading-relaxed max-w-md">
                Dari caption sosmed, foto produk, hingga hitung harga jual dan catat
                keuangan, semua tersedia dalam satu platform yang dirancang khusus
                untuk UMKM.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={() => (prompt.trim() ? runDemo() : fillPrompt(""))}
                  className={`inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors shadow-sm ${focusRing}`}
                >
                  Coba Labain gratis
                </button>
                <span className="text-xs text-gray-500">Tidak perlu login</span>
              </div>
            </div>

            {/* ---------- KANAN: chat demo ---------- */}
            <div className="w-full">
              <div className="bg-white border border-gray-200 rounded-3xl shadow-lg shadow-gray-200/50 p-3">
                <div className="bg-gray-50 rounded-2xl p-4 md:p-5">
                  {messages.length > 0 && (
                    <div aria-live="polite" className="mb-4 space-y-3 max-h-80 overflow-y-auto pr-1">
                      {messages.map((m, i) => (
                        <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                          <p
                            className={`whitespace-pre-wrap text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl max-w-[88%] ${
                              m.role === "user"
                                ? "bg-emerald-600 text-white rounded-br-md"
                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                            }`}
                          >
                            {m.content}
                          </p>
                        </div>
                      ))}
                      {loading && <p className="text-xs text-gray-500">Labain sedang mengetik…</p>}
                    </div>
                  )}

                  <label htmlFor="labain-prompt" className="block text-sm font-medium text-gray-700">
                    Apa yang ingin kamu lakukan dengan usahamu?
                  </label>

                  <div className="mt-3 bg-white border border-gray-200 focus-within:border-emerald-400 rounded-2xl p-2 flex items-end gap-2 transition-colors">
                    <textarea
                      id="labain-prompt"
                      ref={inputRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          runDemo();
                        }
                      }}
                      rows={2}
                      maxLength={600}
                      disabled={limitReached}
                      placeholder="Contoh: Saya jualan keripik pisang, bantu buatkan caption promosi..."
                      className="flex-1 resize-none bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-500 px-2 py-2"
                    />
                    <button
                      type="button"
                      onClick={runDemo}
                      disabled={loading || !prompt.trim() || limitReached}
                      aria-label="Kirim ke Labain"
                      className={`shrink-0 w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>

                  {error && <p role="alert" className="text-xs text-red-600 mt-2">{error}</p>}

                  {(messages.length > 0 || limitReached) && (
                    <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-3 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {limitReached
                          ? "Batas mode coba tercapai. Masuk untuk melanjutkan."
                          : "Suka hasilnya? Masuk untuk menyimpan riwayat dan data usahamu."}
                      </span>
                      <span className="flex items-center gap-3 font-semibold">
                        <Link href="/register" className="underline">Daftar gratis</Link>
                        <button type="button" onClick={resetDemo} className="underline">Mulai baru</button>
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {suggestions.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setPrompt(item)}
                        className={`text-xs bg-white border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 text-gray-600 px-3 py-1.5 rounded-full transition-colors ${focusRing}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 text-center py-2">
                  Coba dulu, tidak perlu login. Mode coba tidak menyimpan percakapan.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      {stats.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 md:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-4 md:px-5 py-4 shadow-sm">
                <div className="text-xl md:text-2xl mb-1" aria-hidden="true">{s.icon}</div>
                <div className="text-xl md:text-2xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= PILAR ================= */}
      <section id="fitur" className="max-w-5xl mx-auto px-6 md:px-8 py-8 md:py-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.025em" }}>
            Satu asisten untuk urusan usahamu
          </h2>
          <p className="text-sm text-gray-600 mt-3">
            Pilih contoh untuk mengisi kotak chat di atas, lalu ubah sesuai usahamu.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <article
              key={p.title}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: p.lightBg, color: p.accent }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={p.path} />
                  </svg>
                </div>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={
                    p.available
                      ? { background: p.lightBg, color: p.accent }
                      : { background: "#f3f4f6", color: "#4b5563" }
                  }
                >
                  {p.available ? "Sudah tersedia" : "Segera hadir"}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mt-4">{p.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mt-1.5">{p.desc}</p>

              <ul className="flex flex-wrap gap-1.5 mt-4 list-none p-0">
                {p.tools.map((t) => (
                  <li key={t.label}>
                    <button
                      type="button"
                      onClick={() => fillPrompt(t.prompt)}
                      className="text-xs bg-gray-50 border border-gray-200 hover:bg-white text-gray-700 px-2.5 py-1 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ outlineColor: p.accent }}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => fillPrompt(p.example)}
                className="mt-auto pt-5 text-left text-sm font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
                style={{ color: p.accent, outlineColor: p.accent }}
              >
                Coba contoh ini
              </button>
            </article>
          ))}
        </div>

        <p className="text-xs text-gray-500 text-center mt-5">
          Analisis usaha dan pendamping perizinan (NIB, halal, PIRT) sedang disiapkan.
        </p>
      </section>

      {/* ================= CARA KERJA ================= */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-12 md:py-14">
          <div className="text-center mb-9">
            <h2 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: "-0.025em" }}>
              Semudah ngobrol dengan asisten
            </h2>
            <p className="text-sm text-gray-600 mt-2">Tidak perlu menjadi ahli digital untuk menggunakan Labain.</p>
          </div>
          <ol className="grid md:grid-cols-3 gap-6 list-none p-0 m-0">
            {steps.map((step, i) => (
              <li key={step.title} className="text-center">
                <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center font-bold text-lg mb-3 ${step.style}`} aria-hidden="true">{i + 1}</div>
                <h3 className="font-bold text-gray-900 text-sm">{step.title}</h3>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="max-w-5xl mx-auto px-6 md:px-8 py-8 text-center">
        <p className="text-xs text-gray-500">© 2026 Labain. Dibuat untuk pelaku usaha Indonesia.</p>
      </footer>
    </main>
  );
}