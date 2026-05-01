"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const businessTypes = [
  {
    label: "Kuliner",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <path d="M4 4v12M7 4c0 3-3 3-3 6M10 4v4a2 2 0 004 0V4M14 4v12" />
      </svg>
    ),
  },
  {
    label: "Fashion",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <path d="M7 3L3 7l3 1v8h8V8l3-1-4-4a2 2 0 01-6 0z" />
      </svg>
    ),
  },
  {
    label: "Kecantikan",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <path d="M10 3c0 0-5 4-5 8a5 5 0 0010 0c0-4-5-8-5-8z" />
      </svg>
    ),
  },
  {
    label: "Elektronik",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <rect x="3" y="5" width="14" height="10" rx="1" />
        <path d="M7 15v2M13 15v2M5 15h10" />
      </svg>
    ),
  },
  {
    label: "Kerajinan",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <path d="M10 3l2 5h5l-4 3 1.5 5L10 13l-4.5 3L7 11 3 8h5z" />
      </svg>
    ),
  },
  {
    label: "Pertanian",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <path d="M10 17V9M10 9C10 9 6 7 4 3c3 0 6 2 6 6zM10 9c0 0 4-2 6-6-3 0-6 2-6 6z" />
      </svg>
    ),
  },
  {
    label: "Jasa",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <circle cx="10" cy="10" r="2" />
        <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.2 5.2l1.4 1.4M13.4 13.4l1.4 1.4M5.2 14.8l1.4-1.4M13.4 6.6l1.4-1.4" />
      </svg>
    ),
  },
  {
    label: "Lainnya",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <circle cx="10" cy="10" r="7" />
        <path d="M10 7v3l2 1" />
      </svg>
    ),
  },
];

const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SectionLabel = ({ icon, children }) => (
  <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
    {icon}
    {children}
  </p>
);

export default function ProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({ namaUsaha: "", jenis: "", deskripsi: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isStep1Valid = form.namaUsaha.trim() && form.jenis;
  const isStep2Valid = form.deskripsi.trim();

  const generate = async () => {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (
          res.status === 402 ||
          res.status === 403 ||
          data?.error === "LIMIT_REACHED" ||
          data?.code === "LIMIT_EXCEEDED"
        ) {
          setShowLimitModal(true);
          return;
        }
        throw new Error(data?.error || "Gagal generate");
      }

      setResult(data.profile);
    } catch (e) {
      console.error(e);
      setError("Gagal generate profil. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const txt =
      `${result.tagline}\n\n${result.about}\n\nKeunggulan Kami:\n` +
      result.keunggulan.map((k, i) => `${i + 1}. ${k}`).join("\n") +
      `\n\n${result.visiMisi}\n\n${result.callToAction}`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <SparkIcon />
            AI Powered
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Profil Usaha Generator</h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Isi data usaha, AI akan buatkan profil profesional.
          </p>
        </div>

        {/* Step bar */}
        <div className="flex gap-2 mb-5">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-emerald-500" : "bg-gray-200"}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-emerald-500" : "bg-gray-200"}`} />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-5">

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nama Usaha</p>
              <input
                type="text"
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 focus:bg-white transition-all"
                placeholder="Contoh: Warung Bu Sari"
                value={form.namaUsaha}
                onChange={(e) => set("namaUsaha", e.target.value)}
              />
            </div>

            <div className="border-t border-gray-50" />

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Jenis Usaha</p>
              <div className="grid grid-cols-4 gap-2">
                {businessTypes.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => set("jenis", b.label)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                      form.jenis === b.label
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-gray-50 border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    {b.icon}
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              Lanjut →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-5">

            {/* Summary chip */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg">
              <span className="font-semibold">{form.namaUsaha}</span>
              <span className="text-emerald-400">·</span>
              <span>{form.jenis}</span>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Deskripsi Usaha</p>
              <textarea
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 focus:bg-white transition-all resize-none"
                rows={5}
                placeholder="Ceritakan produk/layanan, target pelanggan, atau keunggulan utama usaha Anda..."
                value={form.deskripsi}
                onChange={(e) => set("deskripsi", e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setStep(1); setError(""); }}
                className="flex-1 border border-gray-100 py-3.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:border-gray-200 transition-all font-medium"
              >
                ← Kembali
              </button>
              <button
                onClick={generate}
                disabled={!isStep2Valid || loading}
                className="flex-[2] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparkIcon />
                    Generate Profil
                  </>
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-3 bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-5">

            {/* Tagline */}
            <div>
              <SectionLabel icon={
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8l3 3 5-6" /></svg>
              }>Tagline</SectionLabel>
              <p className="text-base font-semibold text-emerald-600 leading-snug">{result.tagline}</p>
            </div>

            <div className="border-t border-gray-50" />

            {/* Tentang */}
            <div>
              <SectionLabel icon={
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2" /><path d="M5 6h6M5 10h4" /></svg>
              }>Tentang Kami</SectionLabel>
              <p className="text-sm text-gray-700 leading-relaxed">{result.about}</p>
            </div>

            <div className="border-t border-gray-50" />

            {/* Keunggulan */}
            <div>
              <SectionLabel icon={
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2l1.5 4h4l-3 2.5 1 4L8 10l-3.5 2.5 1-4L2.5 6h4z" /></svg>
              }>Keunggulan Kami</SectionLabel>
              <ul className="space-y-2">
                {result.keunggulan.map((k, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {k}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-50" />

            {/* Visi Misi */}
            <div>
              <SectionLabel icon={
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 1" /></svg>
              }>Visi & Misi</SectionLabel>
              <p className="text-sm text-gray-700 leading-relaxed">{result.visiMisi}</p>
            </div>

            <div className="border-t border-gray-50" />

            {/* CTA */}
            <div>
              <SectionLabel icon={
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
              }>Call to Action</SectionLabel>
              <p className="text-sm text-gray-700 leading-relaxed">{result.callToAction}</p>
            </div>

            <div className="border-t border-gray-50" />

            {/* Copy button */}
            <button
              onClick={copyAll}
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-colors"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Tersalin!" : "Copy semua"}
            </button>

          </div>
        )}

        {/* Modal Limit */}
        {showLimitModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[90%] max-w-sm rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  ⚠️
                </div>
                <h2 className="text-base font-bold text-gray-900">
                  Limit kamu sudah habis
                </h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Upgrade plan untuk lanjut menggunakan AI Profil Generator
                </p>
              </div>
              <div className="mt-5 space-y-2">
                <button
                  onClick={() => router.push("/plan")}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Upgrade Sekarang
                </button>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Nanti saja
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}