"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const businessTypes = [
  { label: "Kuliner", icon: "🍜" },
  { label: "Fashion", icon: "👕" },
  { label: "Kecantikan", icon: "💄" },
  { label: "Elektronik", icon: "📱" },
  { label: "Kerajinan", icon: "🪵" },
  { label: "Pertanian", icon: "🌱" },
  { label: "Jasa", icon: "🛠️" },
  { label: "Lainnya", icon: "✨" },
];

const gayaOptions = [
  { key: "minimalis", label: "Minimalis", desc: "Simple & clean", icon: "◻️" },
  { key: "modern", label: "Modern", desc: "Bold & confident", icon: "⚡" },
  { key: "tradisional", label: "Tradisional", desc: "Local & warm", icon: "🏮" },
  { key: "playful", label: "Playful", desc: "Friendly & fun", icon: "🎨" },
];

const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const ResultRow = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
  </div>
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

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isStep1Valid = form.namaUsaha.trim() && form.jenis;
  const isStep2Valid = form.filosofi.trim();

  // Download gambar — support URL path (/tmp/...) maupun data URL
  const downloadImage = async (imageUrl) => {
    if (!imageUrl) return;
    setDownloading(true);

    const fileName = `Logo-${form.namaUsaha.replace(/\s+/g, "-") || "Usaha"}.png`;

    try {
      // Jika path relatif (/tmp/...), fetch dulu lalu blob
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

      // Jika data URL (base64)
      if (imageUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = fileName;
        a.click();
        return;
      }

      // Jika URL eksternal — pakai proxy download
      window.location.href = `/api/download?url=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(fileName)}`;
    } catch (e) {
      alert("Gagal download. Coba klik kanan gambar → Save Image.");
    } finally {
      setDownloading(false);
    }
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
        if (res.status === 402 || data?.error === "LIMIT_REACHED") {
          setShowLimitModal(true);
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
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <SparkIcon />
            AI Logo Generator
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Generator Logo Usaha</h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Buat logo + konsep brand otomatis dari AI.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-5">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? "bg-emerald-500" : "bg-gray-200"}`} />
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">Nama Usaha</p>
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Contoh: Warung Bu Sari, Toko Batik Nusantara"
                value={form.namaUsaha}
                onChange={(e) => set("namaUsaha", e.target.value)}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-3">Jenis Usaha</p>
              <div className="grid grid-cols-4 gap-2">
                {businessTypes.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => set("jenis", b.label)}
                    className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                      form.jenis === b.label
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-gray-50 hover:border-emerald-300"
                    }`}
                  >
                    <span className="text-lg">{b.icon}</span>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
            >
              Lanjut →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
            <div className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg inline-block font-medium">
              {form.namaUsaha} • {form.jenis}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">Filosofi Usaha</p>
              <textarea
                className="w-full border rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                rows={4}
                placeholder="Contoh: 'Kami hadir untuk membawa cita rasa tradisional dengan sentuhan modern, terjangkau untuk semua kalangan.'"
                value={form.filosofi}
                onChange={(e) => set("filosofi", e.target.value)}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-3">Gaya Visual Logo</p>
              <div className="grid grid-cols-2 gap-2">
                {gayaOptions.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => set("gaya", g.key)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.gaya === g.key
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-gray-50 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span>{g.icon}</span>
                      <span className="text-sm font-semibold">{g.label}</span>
                    </div>
                    <p className={`text-xs ${form.gaya === g.key ? "text-emerald-100" : "text-gray-400"}`}>
                      {g.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">
                Warna yang Diinginkan <span className="font-normal">(opsional)</span>
              </p>
              <input
                className="w-full border rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Contoh: hijau tua, biru navy, merah bata"
                value={form.warnaPrimer}
                onChange={(e) => set("warnaPrimer", e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border py-3 rounded-xl text-sm hover:bg-gray-50 transition-all"
              >
                Kembali
              </button>
              <button
                onClick={generate}
                disabled={!isStep2Valid || loading}
                className="flex-[2] bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
              >
                {loading ? loadingStep || "Generating..." : "✨ Generate Logo"}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
          </div>
        )}

        {/* RESULT */}
        {result && (
          <div className="mt-6 space-y-4">

            {/* Gambar Logo */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Logo Generated</p>

              {result.image ? (
                <>
                  {result.note && (
                    <p className="text-xs text-amber-500 mb-3">ℹ️ {result.note}</p>
                  )}
                  <div className="bg-gray-50 rounded-xl p-6 mb-4">
                    <img
                      src={result.image}
                      alt={`Logo ${form.namaUsaha}`}
                      className="w-48 h-48 object-contain mx-auto"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                    <p className="text-sm text-gray-400 hidden">
                      Gambar tidak bisa ditampilkan. Coba generate ulang.
                    </p>
                  </div>

                  {/* Download button */}
                  <button
                    onClick={() => downloadImage(result.image)}
                    disabled={downloading}
                    className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {downloading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Mengunduh...
                      </>
                    ) : (
                      <>⬇️ Download Logo</>
                    )}
                  </button>

                  {result.modelUsed && (
                    <p className="text-xs text-gray-300 mt-2">via {result.modelUsed}</p>
                  )}
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                  <p className="text-2xl mb-2">⚠️</p>
                  <p className="text-sm font-semibold text-amber-700">Gambar gagal dibuat</p>
                  <p className="text-xs text-amber-500 mt-1 mb-4">
                    {result.imageError || "Konsep logo berhasil — klik Generate Ulang untuk coba lagi"}
                  </p>
                  <button
                    onClick={generate}
                    disabled={loading}
                    className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all disabled:opacity-40"
                  >
                    {loading ? "Generating..." : "🔄 Coba Lagi"}
                  </button>
                </div>
              )}
            </div>

            {/* Konsep Brand */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Konsep Brand</p>
              <ResultRow label="Konsep" value={result.konsep} />
              <div className="border-t" />
              <ResultRow label="Elemen Visual" value={result.elemenVisual} />
              <div className="border-t" />
              <ResultRow label="Filosofi Desain" value={result.filosofiDesain} />
              <div className="border-t" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Palet Warna</p>
                  <p className="text-sm text-gray-700">{result.palet}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tipografi</p>
                  <p className="text-sm text-gray-700">{result.tipografi}</p>
                </div>
              </div>
              {result.gaya && (
                <>
                  <div className="border-t" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Gaya:</span>
                    <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                      {result.gaya}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Generate ulang */}
            <button
              onClick={generate}
              disabled={loading}
              className="w-full border border-emerald-200 text-emerald-600 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-all disabled:opacity-40"
            >
              {loading ? "Generating..." : "🔄 Generate Ulang"}
            </button>
          </div>
        )}

        {/* LIMIT MODAL — redirect ke /plan */}
        {showLimitModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-[90%] max-w-sm text-center shadow-xl">
              <div className="text-3xl mb-3">🚀</div>
              <h2 className="font-bold text-gray-900">Limit Habis</h2>
              <p className="text-sm text-gray-400 mt-2 mb-4">
                Upgrade untuk terus generate logo tanpa batas
              </p>
              <button
                onClick={() => router.push("/plan")}
                className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-semibold text-sm"
              >
                Upgrade Sekarang
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full mt-2 text-gray-400 text-sm py-2"
              >
                Nanti saja
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}