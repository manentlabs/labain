"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

const styleOptions = [
  { key: "product-clean", label: "Clean White", desc: "Background putih bersih", icon: "⬜" },
  { key: "lifestyle", label: "Lifestyle", desc: "Natural & relatable", icon: "🌿" },
  { key: "premium-dark", label: "Premium Dark", desc: "Mewah & eksklusif", icon: "🖤" },
  { key: "flat-lay", label: "Flat Lay", desc: "Top-down editorial", icon: "📐" },
  { key: "outdoor-natural", label: "Outdoor", desc: "Fresh & authentic", icon: "☀️" },
];

const platformOptions = [
  { key: "shopee", label: "Shopee" },
  { key: "instagram", label: "Instagram" },
  { key: "tokopedia", label: "Tokopedia" },
  { key: "general", label: "General" },
];

export default function PhotoPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [style, setStyle] = useState("product-clean");
  const [platform, setPlatform] = useState("general");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 10MB.");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const downloadImage = async (imageUrl) => {
    if (!imageUrl) return;
    setDownloading(true);
    const fileName = `FotoProduk-AI-${Date.now()}.png`;

    try {
      // Path relatif (/tmp/...) — fetch lalu blob
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

      // Data URL (base64)
      if (imageUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = fileName;
        a.click();
        return;
      }

      // URL eksternal — via proxy
      window.location.href = `/api/download?url=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(fileName)}`;
    } catch {
      alert("Gagal download. Coba klik kanan gambar → Save Image.");
    } finally {
      setDownloading(false);
    }
  };

  const generate = async () => {
    if (!image) return;

    setLoading(true);
    setError("");
    setResult(null);
    setLoadingStep("Menganalisis produk...");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("style", style);
    formData.append("platform", platform);
    formData.append("context", context);

    try {
      const res = await fetch("/api/photo", {
        method: "POST",
        body: formData,
      });

      setLoadingStep("Membuat foto iklan...");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402 || data?.error === "LIMIT_REACHED") {
          setShowLimitModal(true);
          return;
        }
        throw new Error(data?.error || "Gagal generate foto");
      }

      setResult(data.result);
    } catch (e) {
      setError(e.message || "Gagal memproses gambar. Coba lagi.");
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
            AI Product Studio
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Foto Produk AI</h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Ubah foto biasa jadi iklan profesional dengan AI.
          </p>
        </div>

        {/* Upload & Config */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all"
          >
            {preview ? (
              <img
                src={preview}
                className="max-h-56 object-contain mx-auto rounded-lg"
                alt="Preview produk"
              />
            ) : (
              <div className="text-gray-400 space-y-2">
                <p className="text-3xl">📷</p>
                <p className="text-sm font-medium">Klik atau drag foto produk ke sini</p>
                <p className="text-xs">JPG, PNG, WebP — maks 10MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          {preview && (
            <button
              onClick={() => {
                setImage(null);
                setPreview(null);
                setResult(null);
              }}
              className="text-xs text-gray-400 hover:text-red-400 transition-all"
            >
              × Ganti foto
            </button>
          )}

          {/* Gaya Foto */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-3">Gaya Foto</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {styleOptions.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStyle(s.key)}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                    style === s.key
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-gray-50 hover:border-emerald-300"
                  }`}
                >
                  <span className="text-base">{s.icon}</span>
                  <span className="font-semibold">{s.label}</span>
                  <span className={`text-center leading-tight ${style === s.key ? "text-emerald-100" : "text-gray-400"}`}>
                    {s.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Platform Tujuan</p>
            <div className="flex gap-2 flex-wrap">
              {platformOptions.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlatform(p.key)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    platform === p.key
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-gray-50 hover:border-emerald-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Konteks tambahan */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">
              Konteks Tambahan <span className="font-normal">(opsional)</span>
            </p>
            <input
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Contoh: produk untuk ibu hamil, target anak muda"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <button
            onClick={generate}
            disabled={!image || loading}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
          >
            {loading ? loadingStep || "Processing..." : "✨ Generate Foto Iklan"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-6 space-y-4">

            {/* Perbandingan before/after */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hasil</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1.5 text-center">Sebelum</p>
                <img
                  src={preview}
                  alt="Original"
                  className="w-full rounded-xl object-contain bg-gray-50 border aspect-square"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1.5 text-center">Sesudah</p>
                {result.image ? (
                  <img
                    src={result.image}
                    alt="AI Result"
                    className="w-full rounded-xl object-contain bg-gray-50 border aspect-square"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full aspect-square rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-center p-4">
                    <div>
                      <p className="text-amber-600 text-xs font-semibold">Gagal dibuat</p>
                      <p className="text-amber-400 text-xs mt-1">{result.imageError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info produk */}
            {result.product?.name && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Produk Terdeteksi</p>
                <p className="text-sm text-gray-700">{result.product.name}</p>
                {result.product.colors && (
                  <p className="text-xs text-gray-400">{result.product.colors}</p>
                )}
              </div>
            )}

            {/* Download */}
            {result.image && (
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
                ) : "⬇️ Download Foto Produk"}
              </button>
            )}

            {/* Generate ulang */}
            <button
              onClick={generate}
              disabled={loading}
              className="w-full border border-emerald-200 text-emerald-600 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-all disabled:opacity-40"
            >
              {loading ? loadingStep || "Generating..." : "🔄 Generate Ulang"}
            </button>
          </div>
        )}

        {/* Limit Modal */}
        {showLimitModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-[90%] max-w-sm text-center shadow-xl">
              <div className="text-3xl mb-3">🚀</div>
              <h2 className="font-bold text-gray-900">Limit Habis</h2>
              <p className="text-sm text-gray-400 mt-2 mb-4">
                Upgrade untuk terus generate foto produk tanpa batas
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