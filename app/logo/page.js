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

const gayaOptions = [
  {
    key: "minimalis",
    label: "Minimalis",
    desc: "Simple & clean",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
        <rect x="3" y="3" width="10" height="10" rx="1" />
      </svg>
    ),
  },
  {
    key: "modern",
    label: "Modern",
    desc: "Bold & confident",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
        <path d="M8 2l2 5h4l-3.5 3 1.5 5L8 12l-4 3 1.5-5L2 7h4z" />
      </svg>
    ),
  },
  {
    key: "tradisional",
    label: "Tradisional",
    desc: "Local & warm",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
        <path d="M8 2l4 4v8H4V6z" />
        <path d="M6 14v-4h4v4" />
      </svg>
    ),
  },
  {
    key: "playful",
    label: "Playful",
    desc: "Friendly & fun",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
        <circle cx="8" cy="8" r="6" />
        <path d="M5.5 10c.5 1 3.5 1 5 0M6 6.5v.5M10 6.5v.5" />
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

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6M23 20v-6h-6" />
    <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" />
  </svg>
);

const SectionLabel = ({ icon, children }) => (
  <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
    {icon}
    {children}
  </p>
);

export default function LogoPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    namaUsaha: "",
    jenis: "",
    filosofi: "",
    gaya: "minimalis",
    warnaPrimer: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isStep1Valid = form.namaUsaha.trim() && form.jenis;
  const isStep2Valid = form.filosofi.trim();

  const downloadImage = async (imageUrl) => {
    if (!imageUrl) return;
    setDownloading(true);
    const fileName = `Logo-${form.namaUsaha.replace(/\s+/g, "-") || "Usaha"}.png`;
    try {
      if (imageUrl.startsWith("/")) {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error("Gagal mengambil file");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(blobUrl);
        return;
      }
      if (imageUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = fileName;
        a.click();
        return;
      }
      window.location.href = `/api/download?url=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(fileName)}`;
    } catch (e) {
      alert("Gagal download. Coba klik kanan gambar → Save Image.");
    } finally {
      setDownloading(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const txt = [
      result.konsep,
      result.elemenVisual,
      result.filosofiDesain,
      `Palet Warna: ${result.palet}`,
      `Tipografi: ${result.tipografi}`,
      result.gaya ? `Gaya: ${result.gaya}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generate = async () => {
    setLoading(true);
    setResult(null);
    setError("");
    setLoadingStep("Merancang konsep logo...");

    try {
      const res = await fetch("/api/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setLoadingStep("Membuat gambar logo...");
      const data = await res.json();

      if (!res.ok) {
        // SESUDAH
		if (res.status === 401) {
		  setError("Silakan login terlebih dahulu.");
		  return;
		}
		if (res.status === 403 || res.status === 402) {
		  setShowLimitModal(true);
		  setLoading(false);   // ← jangan lupa ini
		  setLoadingStep("");
		  return;
		}
        throw new Error(data?.error || "Gagal generate logo");
      }

      setResult(data.logo);
    } catch (e) {
      setError(e.message || "Gagal generate logo. Coba lagi.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <SparkIcon />
            AI Logo Generator
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Generator Logo Usaha</h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Buat logo + konsep brand otomatis dari AI.
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
                placeholder="Contoh: Warung Bu Sari, Toko Batik Nusantara"
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Filosofi Usaha</p>
              <textarea
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 focus:bg-white transition-all resize-none"
                rows={4}
                placeholder="Contoh: 'Kami hadir untuk membawa cita rasa tradisional dengan sentuhan modern, terjangkau untuk semua kalangan.'"
                value={form.filosofi}
                onChange={(e) => set("filosofi", e.target.value)}
              />
            </div>

            <div className="border-t border-gray-50" />

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Gaya Visual Logo</p>
              <div className="grid grid-cols-2 gap-2">
                {gayaOptions.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => set("gaya", g.key)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.gaya === g.key
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-gray-50 border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {g.icon}
                      <span className="text-sm font-semibold">{g.label}</span>
                    </div>
                    <p className={`text-xs ${form.gaya === g.key ? "text-emerald-100" : "text-gray-400"}`}>
                      {g.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-50" />

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Warna yang Diinginkan{" "}
                <span className="font-normal normal-case tracking-normal text-gray-300">(opsional)</span>
              </p>
              <input
                type="text"
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 focus:bg-white transition-all"
                placeholder="Contoh: hijau tua, biru navy, merah bata"
                value={form.warnaPrimer}
                onChange={(e) => set("warnaPrimer", e.target.value)}
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
                    {loadingStep || "Generating..."}
                  </>
                ) : (
                  <>
                    <SparkIcon />
                    Generate Logo
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
          <div className="mt-3 space-y-3">

            {/* Gambar Logo */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
              <SectionLabel icon={
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="12" height="12" rx="2" />
                  <circle cx="5.5" cy="5.5" r="1" />
                  <path d="M14 10l-3-3-6 6" />
                </svg>
              }>Logo Generated</SectionLabel>

              {result.image ? (
                <>
                  {result.note && (
                    <p className="text-xs text-amber-500 mb-3 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      {result.note}
                    </p>
                  )}
                  <div className="bg-gray-50 rounded-xl p-6 mb-4 flex items-center justify-center">
                    <img
                      src={result.image}
                      alt={`Logo ${form.namaUsaha}`}
                      className="w-48 h-48 object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                    <p className="text-sm text-gray-400 hidden text-center">
                      Gambar tidak bisa ditampilkan. Coba generate ulang.
                    </p>
                  </div>

                  <button
                    onClick={() => downloadImage(result.image)}
                    disabled={downloading}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {downloading ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Mengunduh...
                      </>
                    ) : (
                      <>
                        <DownloadIcon />
                        Download Logo
                      </>
                    )}
                  </button>

                  {result.modelUsed && (
                    <p className="text-xs text-gray-300 mt-2 text-center">via {result.modelUsed}</p>
                  )}
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="mx-auto mb-2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-sm font-semibold text-amber-700">Gambar gagal dibuat</p>
                  <p className="text-xs text-amber-500 mt-1 mb-4">
                    {result.imageError || "Konsep logo berhasil — klik Generate Ulang untuk coba lagi"}
                  </p>
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all disabled:opacity-40"
                  >
                    {loading ? "Generating..." : "Generate Ulang"}
                  </button>
                </div>
              )}
            </div>

            {/* Konsep Brand */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-5">
              <SectionLabel icon={
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 1" />
                </svg>
              }>Konsep Brand</SectionLabel>

              <div>
                <SectionLabel icon={
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8l3 3 5-6" /></svg>
                }>Konsep</SectionLabel>
                <p className="text-sm text-gray-700 leading-relaxed">{result.konsep}</p>
              </div>

              <div className="border-t border-gray-50" />

              <div>
                <SectionLabel icon={
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2l1.5 4h4l-3 2.5 1 4L8 10l-3.5 2.5 1-4L2.5 6h4z" /></svg>
                }>Elemen Visual</SectionLabel>
                <p className="text-sm text-gray-700 leading-relaxed">{result.elemenVisual}</p>
              </div>

              <div className="border-t border-gray-50" />

              <div>
                <SectionLabel icon={
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 1" /></svg>
                }>Filosofi Desain</SectionLabel>
                <p className="text-sm text-gray-700 leading-relaxed">{result.filosofiDesain}</p>
              </div>

              <div className="border-t border-gray-50" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <SectionLabel icon={
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="8" r="2" /><circle cx="11" cy="8" r="2" /></svg>
                  }>Palet Warna</SectionLabel>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.palet}</p>
                </div>
                <div>
                  <SectionLabel icon={
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h10M3 8h7M3 12h5" /></svg>
                  }>Tipografi</SectionLabel>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.tipografi}</p>
                </div>
              </div>

              {result.gaya && (
                <>
                  <div className="border-t border-gray-50" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Gaya:</span>
                    <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                      {result.gaya}
                    </span>
                  </div>
                </>
              )}

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

            {/* Generate ulang */}
            <button
              onClick={generate}
              disabled={loading}
              className="w-full border border-gray-100 py-3.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-white hover:border-gray-200 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <RefreshIcon />
              {loading ? "Generating..." : "Generate Ulang"}
            </button>
          </div>
        )}

        {/* Modal Limit */}
        {showLimitModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[90%] max-w-sm rounded-2xl p-6 shadow-xl">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900">Limit kamu sudah habis</h2>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Upgrade plan untuk lanjut generate logo tanpa batas
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