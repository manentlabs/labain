"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

export default function PhotoPage() {
  const router = useRouter();

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

	const downloadImage = () => {
	  if (!result?.image) return;

	  // Nama file default atau bisa ambil dari konteks produk
	  const fileName = "ai-product-photo.png";

	  // Gunakan API Proxy untuk bypass CORS
	  window.location.href = `/api/download?url=${encodeURIComponent(result.image)}&name=${encodeURIComponent(fileName)}`;
	};
	
  const generate = async () => {
    if (!image) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("style", "premium product advertising, studio lighting");

    try {
      const res = await fetch("/api/photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402 || data?.error === "LIMIT_REACHED") {
          setShowLimitModal(true);
          return;
        }
        throw new Error(data?.error || "Gagal generate");
      }

      setResult(data.result);
    } catch (e) {
      setError("Gagal memproses gambar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <SparkIcon />
            AI Product Studio
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Foto Produk AI
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Ubah foto biasa jadi iklan profesional.
          </p>
        </div>

        {/* UPLOAD */}
        <div className="bg-white border rounded-2xl p-6 space-y-5">

          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="w-full text-sm"
          />

          {preview && (
            <img
              src={preview}
              className="w-full h-64 object-contain border rounded-xl bg-gray-50"
            />
          )}

          <button
            onClick={generate}
            disabled={!image || loading}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold"
          >
            {loading ? "Enhancing..." : "Generate Foto Iklan"}
          </button>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {result && (
		  <div className="mt-6 bg-white border rounded-2xl p-6 space-y-4">
			<div className="text-center">
			  <img
				src={result.image}
				alt="AI Product Result"
				className="w-full rounded-xl object-contain bg-gray-50 border"
			  />
			</div>
			
			<button
			  onClick={downloadImage}
			  className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all"
			>
			  Download Foto Produk
			</button>
		  </div>
		)}

        {/* LIMIT MODAL */}
        {showLimitModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl w-[90%] max-w-sm text-center">
              <h2 className="font-bold">Limit habis</h2>
              <p className="text-sm text-gray-400 mt-2">
                Upgrade untuk lanjut generate foto
              </p>

              <button
                onClick={() => router.push("/plan")}
                className="w-full mt-4 bg-emerald-500 text-white py-2 rounded-xl"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}