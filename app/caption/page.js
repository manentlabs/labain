"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const toneOptions = [
  { label: "Santai", value: "santai", emoji: "😊" },
  { label: "Profesional", value: "profesional", emoji: "💼" },
  { label: "Lucu", value: "lucu", emoji: "😂" },
  { label: "Promosi", value: "promosi", emoji: "🔥" },
];

// Simple SVG Icons
const IgIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const TtIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 000 12.68 6.34 6.34 0 006.33-6.34V8.88a8.28 8.28 0 004.84 1.54V7a4.85 4.85 0 01-1.07-.31z"/>
  </svg>
);

const FbIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);

const ShopeeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 2h12l1 6H5L6 2zM3 9h18l-1.5 12a1 1 0 01-1 .9H5.5a1 1 0 01-1-.9L3 9zm7 4v5m4-5v5"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SparkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const platformOptions = [
  { label: "Instagram", value: "instagram", Icon: IgIcon },
  { label: "TikTok", value: "tiktok", Icon: TtIcon },
  { label: "Facebook", value: "facebook", Icon: FbIcon },
  { label: "Shopee", value: "shopee", Icon: ShopeeIcon },
];

export default function CaptionPage() {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [tone, setTone] = useState("santai");
  const [platform, setPlatform] = useState("instagram");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: input, tone, platform }),
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

      setResult(data?.caption || "");
    } catch (err) {
      console.error(err);
      setResult("Gagal generate caption. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
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
          <h1 className="text-3xl font-bold text-gray-900">
            Caption Generator
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Masukkan nama produkmu, pilih gaya dan platform.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Deskripsi Produk</p>
          <textarea
            className="w-full border border-gray-100 bg-gray-50 rounded-xl p-4 text-sm outline-none focus:border-emerald-400 focus:bg-white transition-colors resize-none"
            rows={3}
            placeholder="Contoh: Tas kulit wanita cokelat, elegan, cocok untuk kerja..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Platform & Tone */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-3 space-y-5">

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Platform</p>
            <div className="flex gap-2 flex-wrap">
              {platformOptions.map(({ label, value, Icon }) => (
                <button
                  key={value}
                  onClick={() => setPlatform(value)}
                  className={`inline-flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-all ${
                    platform === value
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-50" />

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tone</p>
            <div className="flex gap-2 flex-wrap">
              {toneOptions.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`px-3 py-2 border rounded-xl text-sm font-medium transition-all ${
                    tone === t.value
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={loading || !input.trim()}
          className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
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
              Generate Caption
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div className="mt-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hasil Caption</p>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? "Tersalin!" : "Copy"}
              </button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{result}</p>
            <p className="text-xs text-gray-300 mt-3 text-right">{result.length} karakter</p>
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
                  Upgrade plan untuk lanjut menggunakan AI Caption Generator
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