"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ---------------------------------------------------------
   Riwayat percakapan sekarang ada di Navbar. Komponen ini hanya
   membaca ?c=<id> dari URL untuk tahu percakapan mana yang dibuka:
     /home        -> percakapan baru
     /home?c=<id> -> buka percakapan tersimpan
   Navbar diberi tahu lewat event CHANGED_EVENT saat daftar berubah.
---------------------------------------------------------- */
const CHAT_PATH = "/home";
const CHAT_ENDPOINT = "/api/chat";
const CONVERSATIONS_ENDPOINT = "/api/conversations";
const CHANGED_EVENT = "labain:conversations-changed";
const MAX_LENGTH = 1000;
const MAX_IMAGE_SIDE = 1280;
const DEFAULT_PHOTO_PROMPT = "Buatkan foto produk yang menarik dari foto ini.";

type OutImage = { url: string; label: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  attached?: string; // pratinjau foto yang baru dilampirkan (tidak disimpan di server)
  hasAttachment?: boolean; // penanda untuk pesan lama yang memuat foto
  images?: OutImage[]; // gambar hasil dari asisten
};

const DATA_HREF = "/data-usaha";

// Lima hal yang bisa dikerjakan Labain. "example" diisikan ke kotak pesan supaya bisa disesuaikan dulu.
const capabilities: {
  title: string;
  description: string;
  example?: string;
  photo?: boolean;
  dataLink?: boolean;
  accent: string;
  lightBg: string;
  path: string;
}[] = [
  {
    title: "Tulis konten promosi",
    description: "Caption Instagram, deskripsi produk, atau pesan WhatsApp untuk pelanggan.",
    example: "Buatkan caption Instagram untuk produk saya",
    accent: "#059669",
    lightBg: "#ecfdf5",
    path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    title: "Hitung harga jual",
    description: "Masukkan modal per produk, lalu dapatkan saran harga jual beserta untungnya.",
    example: "Hitung harga jual dari modal Rp8.000 per bungkus",
    accent: "#7c3aed",
    lightBg: "#f5f3ff",
    path: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  },
  {
    title: "Catat keuangan",
    description: "Ceritakan penjualan dan biaya dengan kalimat biasa. Labain mencatatnya untukmu.",
    example: "Hari ini jual 40 bungkus @Rp15.000, biaya bahan Rp350.000",
    dataLink: true,
    accent: "#0369a1",
    lightBg: "#f0f9ff",
    path: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  },
  {
    title: "Buat logo",
    description: "Ceritakan usahamu dan gayanya, Labain membuatkan logo yang bisa diunduh.",
    example: "Buatkan logo untuk usaha keripik pisang saya",
    accent: "#b45309",
    lightBg: "#fffbeb",
    path: "M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
  {
    title: "Rapikan foto produk",
    description:
      "Lampirkan foto produk dari HP, lalu Labain mengubahnya menjadi foto yang lebih menarik untuk dipasang di toko online.",
    photo: true,
    accent: "#be185d",
    lightBg: "#fdf2f8",
    path: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  },
];

// Susunan kolom: 3 kartu di baris pertama, 2 kartu lebar di baris kedua (layar lg).
const cardSpan = [
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-3",
  "md:col-span-2 lg:col-span-3",
];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

// Perkecil foto di browser supaya kiriman ringan dan muat di batas server.
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Foto tidak bisa dibaca. Gunakan format JPG atau PNG."));
    };
    img.src = url;
  });
}

const notifyChanged = () => window.dispatchEvent(new Event(CHANGED_EVENT));

// useSearchParams butuh Suspense, jadi dibungkus di sini supaya page.tsx tidak perlu diubah.
export default function HomeChat(props: { userName?: string }) {
  return (
    <Suspense fallback={null}>
      <Chat {...props} />
    </Suspense>
  );
}

function Chat({ userName }: { userName?: string }) {
  const router = useRouter();
  const urlId = useSearchParams().get("c");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [prompt, setPrompt] = useState("");
  const [attached, setAttached] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  const convRef = useRef<string | null>(null); // id percakapan yang sedang tampil
  const epoch = useRef(0); // naik setiap ganti percakapan; balasan lama diabaikan
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const busy = loading || opening;

  // Gulir ke pesan terbaru setiap ada pesan baru.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // URL berubah (klik riwayat di Navbar) -> samakan isi chat.
  useEffect(() => {
    if (urlId === convRef.current) return;
    if (urlId) openConversation(urlId);
    else resetChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  function resetChat() {
    epoch.current++;
    convRef.current = null;
    setMessages([]);
    setPrompt("");
    setAttached(null);
    setError("");
    setLoading(false);
    setOpening(false);
    inputRef.current?.focus();
  }

  async function openConversation(id: string) {
    const my = ++epoch.current;
    setOpening(true);
    setLoading(false);
    setError("");
    try {
      const res = await fetch(`${CONVERSATIONS_ENDPOINT}/${id}`);
      const data = await res.json().catch(() => ({}));
      if (my !== epoch.current) return;
      if (res.status === 401) throw new Error("Sesi berakhir. Silakan masuk lagi.");
      if (!res.ok) throw new Error(data.error || "Percakapan tidak bisa dibuka.");

      setMessages(
        (data.messages ?? []).map(
          (m: { role: "user" | "assistant"; content: string; images?: OutImage[] | null; hasAttachment?: boolean }) => ({
            role: m.role,
            content: m.content,
            images: m.images ?? [],
            hasAttachment: m.hasAttachment,
          })
        )
      );
      convRef.current = id;
      setPrompt("");
      setAttached(null);
    } catch (e) {
      if (my !== epoch.current) return;
      const msg = e instanceof Error ? e.message : "Percakapan tidak bisa dibuka.";
      resetChat();
      router.replace(CHAT_PATH);
      setError(msg);
    } finally {
      if (my === epoch.current) setOpening(false);
    }
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Lampiran harus berupa gambar (JPG atau PNG).");
      return;
    }
    try {
      setAttached(await fileToDataUrl(file));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Foto tidak bisa dibaca.");
    }
  }

  async function send(text?: string) {
    const q = (text ?? prompt).trim() || (attached ? DEFAULT_PHOTO_PROMPT : "");
    if (!q || busy) return;

    const my = epoch.current;
    const photo = attached;
    const next: Msg[] = [...messages, { role: "user", content: q, attached: photo ?? undefined }];
    setMessages(next);
    setPrompt("");
    setAttached(null);
    setError("");
    setLoading(true);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convRef.current, message: q, image: photo }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error("Sesi berakhir. Silakan masuk lagi.");
      if (!res.ok) throw new Error(data.error || "Terjadi kesalahan. Coba lagi.");

      notifyChanged();
      if (my !== epoch.current) return; // pengguna sudah pindah percakapan

      const isNew = !convRef.current;
      convRef.current = data.conversationId;
      setMessages([...next, { role: "assistant", content: data.reply, images: data.images ?? [] }]);
      // Percakapan baru dapat alamatnya sendiri, jadi Navbar bisa menandainya sebagai aktif.
      if (isNew) router.replace(`${CHAT_PATH}?c=${data.conversationId}`, { scroll: false });
    } catch (e) {
      if (my !== epoch.current) return;
      // Kembalikan pesan dan foto ke kotak supaya bisa dikirim ulang.
      setMessages(messages);
      setPrompt(q === DEFAULT_PHOTO_PROMPT && photo ? "" : q);
      setAttached(photo);
      setError(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      if (my === epoch.current) {
        setLoading(false);
        inputRef.current?.focus();
      }
    }
  }

  const isEmpty = messages.length === 0;

  // Isi contoh ke kotak pesan (bukan langsung kirim) supaya angka dan nama produknya bisa diganti.
  function fillPrompt(text: string) {
    setPrompt(text);
    setError("");
    inputRef.current?.focus();
  }

  return (
    // Tinggi mobile dikurangi header (3rem) dan bar bawah Navbar (~4rem). Sesuaikan jika layout berbeda.
    <div
      className="flex h-[calc(100dvh_-_7rem_-_env(safe-area-inset-bottom,0px))] flex-col bg-gray-50 md:h-[100dvh]"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* ---------- Daftar pesan ---------- */}
      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto px-4 py-6 md:px-6 ${isEmpty && !opening ? "max-w-5xl" : "max-w-3xl"}`}>
          {opening ? (
            <p className="pt-16 text-center text-sm text-gray-500">Membuka percakapan…</p>
          ) : isEmpty ? (
            <div className="pt-2 md:pt-8">
              <div className="mx-auto mb-8 max-w-xl text-center">
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl" style={{ letterSpacing: "-0.03em" }}>
                  {userName ? `Halo, ${userName}.` : "Halo."} Saya Labain.
                </h1>
                <p className="mt-3 text-sm text-gray-600">
                  Asisten untuk usaha kecil. Ini lima hal yang bisa saya kerjakan. Pilih salah satu contoh,
                  ubah sesuai usahamu, lalu kirim.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                {capabilities.map((c, i) => (
                  <article
                    key={c.title}
                    className={`flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${cardSpan[i] ?? ""}`}
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ background: c.lightBg, color: c.accent }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={c.path} />
                      </svg>
                    </div>

                    <h2 className="mt-4 text-base font-bold text-gray-900">{c.title}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{c.description}</p>

                    {c.example && (
                      <p className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-700">
                        &ldquo;{c.example}&rdquo;
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      {c.photo ? (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={busy}
                          className="rounded text-left text-sm font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                          style={{ color: c.accent, outlineColor: c.accent }}
                        >
                          Pilih foto produk
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fillPrompt(c.example!)}
                          aria-label={`Pakai contoh: ${c.example}`}
                          className="rounded text-left text-sm font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{ color: c.accent, outlineColor: c.accent }}
                        >
                          Coba contoh ini
                        </button>
                      )}
                      {c.dataLink && (
                        <Link
                          href={DATA_HREF}
                          className={`rounded text-xs font-medium text-gray-600 hover:underline ${focusRing}`}
                        >
                          Lihat Data Usaha
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-gray-500">
                Makin lengkap profil usahamu, makin pas caption dan saran dari Labain.{" "}
                <Link href={DATA_HREF} className={`rounded font-medium text-emerald-700 hover:underline ${focusRing}`}>
                  Lengkapi profil usaha
                </Link>
              </p>
            </div>
          ) : (
            <div aria-live="polite" className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[75%] ${
                      m.role === "user"
                        ? "rounded-br-md bg-emerald-600 text-white"
                        : "rounded-bl-md border border-gray-200 bg-white text-gray-800"
                    }`}
                  >
                    {m.attached && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.attached} alt="Foto yang dilampirkan" className="mb-2 w-40 max-w-full rounded-xl" />
                    )}
                    {!m.attached && m.hasAttachment && (
                      <p className="mb-1 text-xs italic opacity-80">Foto dilampirkan</p>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {m.images && m.images.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {m.images.map((img) => (
                          <figure key={img.url} className="m-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.label}
                              className="w-full max-w-sm rounded-xl border border-gray-100"
                            />
                            <figcaption className="mt-1.5 flex items-center gap-3 text-xs">
                              <span className="text-gray-500">{img.label}</span>
                              <a
                                href={img.url}
                                download
                                className={`rounded font-semibold text-emerald-700 hover:underline ${focusRing}`}
                              >
                                Unduh
                              </a>
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <p className="text-xs text-gray-500">
                  Labain sedang bekerja… (gambar bisa memakan waktu sampai satu menit)
                </p>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* ---------- Kotak input ---------- */}
      <div className="shrink-0 border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-3 md:px-6">
          {error && (
            <p role="alert" className="mb-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-2 transition-colors focus-within:border-emerald-400">
            {attached && (
              <div className="relative m-1 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attached} alt="Foto yang akan dikirim" className="h-16 rounded-lg" />
                <button
                  type="button"
                  onClick={() => setAttached(null)}
                  aria-label="Hapus foto"
                  className={`absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-xs leading-none text-white ${focusRing}`}
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" tabIndex={-1} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                aria-label="Lampirkan foto produk"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-emerald-700 disabled:opacity-50 ${focusRing}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              <label htmlFor="labain-chat" className="sr-only">
                Tulis pesan untuk Labain
              </label>
              <textarea
                id="labain-chat"
                ref={inputRef}
                autoFocus
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                maxLength={MAX_LENGTH}
                placeholder="Tulis pesan… (Shift + Enter untuk baris baru)"
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-500"
              />

              <button
                type="button"
                onClick={() => send()}
                disabled={busy || (!prompt.trim() && !attached)}
                aria-label="Kirim ke Labain"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}