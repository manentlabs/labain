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

const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);

export default function LogoPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    namaUsaha: "",
    jenis: "",
    filosofi: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isStep1Valid = form.namaUsaha.trim() && form.jenis;
  const isStep2Valid = form.filosofi.trim();
  
  const downloadImage = (url) => {
	  if (!url) return;

	  // Nama file yang akan disimpan
	  const fileName = `Logo-${form.namaUsaha.replace(/\s+/g, "-") || "Usaha"}.png`;

	  // Arahkan ke API Proxy kita
	  // Ini akan memicu download otomatis secara native oleh browser
	  window.location.href = `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}`;
	};

  const generate = async () => {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

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
      setError("Gagal generate logo. Coba lagi.");
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900">
            Generator Logo Usaha
          </h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Buat logo + filosofi brand otomatis dari AI.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-5">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-emerald-500" : "bg-gray-200"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-emerald-500" : "bg-gray-200"}`} />
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">

            <input
              className="w-full border rounded-xl px-4 py-3 text-sm bg-gray-50"
              placeholder="Nama usaha kamu"
              value={form.namaUsaha}
              onChange={(e) => set("namaUsaha", e.target.value)}
            />

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-3">Jenis Usaha</p>
              <div className="grid grid-cols-4 gap-2">
                {businessTypes.map((b) => (
                  <button
                    key={b.label}
                    onClick={() => set("jenis", b.label)}
                    className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1 ${
                      form.jenis === b.label
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-50"
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
              className="w-full bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              Lanjut →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">

            <div className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg inline-block">
              {form.namaUsaha} • {form.jenis}
            </div>

            <textarea
              className="w-full border rounded-xl px-4 py-3 text-sm bg-gray-50"
              rows={5}
              placeholder="Ceritakan filosofi usaha kamu (misal: sederhana, premium, tradisional, modern, dll)"
              value={form.filosofi}
              onChange={(e) => set("filosofi", e.target.value)}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border py-3 rounded-xl text-sm"
              >
                Kembali
              </button>

              <button
                onClick={generate}
                disabled={!isStep2Valid || loading}
                className="flex-[2] bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold"
              >
                {loading ? "Generating..." : "Generate Logo"}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        )}

        {/* RESULT */}
		{result && (
		  <div className="mt-6 bg-white border rounded-2xl p-6 space-y-4">

			<div>
			  <p className="text-xs text-gray-400">Konsep Logo</p>
			  <p className="text-sm text-gray-700">{result.konsep}</p>
			</div>

			<div className="border-t" />

			<div>
			  <p className="text-xs text-gray-400">Filosofi Logo</p>
			  <p className="text-sm text-gray-700">{result.filosofi}</p>
			</div>

			<div className="border-t" />

			<div>
			  <p className="text-xs text-gray-400">Deskripsi Logo</p>
			  <p className="text-sm text-gray-700">{result.deskripsi}</p>
			</div>

			<div className="border-t" />

			{/* IMAGE */}
			<div className="text-center">
			  <img
				src={result.image}
				alt="logo"
				className="mx-auto w-40 h-40 object-contain"
			  />
			</div>


			<button 
			  onClick={() => downloadImage(result.image)}
			  className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all"
			>
			  Download Logo
			</button>
		  </div>
		)}

        {/* LIMIT MODAL */}
        {showLimitModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl w-[90%] max-w-sm text-center">
              <h2 className="font-bold">Limit habis</h2>
              <p className="text-sm text-gray-400 mt-2">
                Upgrade untuk lanjut generate logo
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