import OpenAI from "openai";
import { NextResponse } from "next/server";

/* Endpoint mode coba (tanpa login) untuk kotak chat di landing page.
   Memakai OPENAI_API_KEY yang sama dengan route caption. */

const MODEL = "gpt-4o-mini";
const MAX_CHARS = 600;
const MAX_TURNS = 6;
const RATE_LIMIT = 10; // permintaan per IP per jam
const WINDOW_MS = 60 * 60 * 1000;

// Penghitung in-memory: cukup untuk awal, tetapi reset saat server restart dan
// tidak dibagi antar instance serverless. Untuk produksi pakai Upstash/Redis.
const hits = new Map();
function isLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

const SYSTEM = `Kamu Labain, asisten AI untuk pelaku UMKM Indonesia, sekaligus copywriter senior yang paham e-commerce, media sosial, dan psikologi pembeli lokal. Jawab dalam bahasa Indonesia yang santai, sopan, dan ringkas.
Ini mode coba tanpa login, data tidak disimpan.

Yang bisa kamu bantu di mode coba:
1. Caption dan ide promosi. Struktur caption: hook kuat di kalimat pertama, isi berupa manfaat nyata dari sudut pembeli, lalu CTA yang spesifik. Instagram boleh diberi 5-10 hashtag di akhir. Tulis langsung captionnya tanpa judul atau label bagian. Hindari klise seperti "kualitas terjamin" atau "harga terjangkau" tanpa konteks. Kalau platform tidak disebut, pakai Instagram.
2. Menghitung harga jual dari modal dan margin. Untuk angka harga WAJIB memakai tool hitung_harga_jual, jangan menghitung sendiri.

Kalau informasi kurang (produk, modal per unit, margin), tanyakan 1-2 hal saja, atau beri contoh dengan menyebut asumsimu.
Jangan mengarang data usaha pengguna. Untuk catat keuangan, logo, foto produk, dan profil usaha, katakan fitur itu tersedia setelah masuk atau daftar.
Tolak dengan sopan permintaan di luar urusan usaha.`;

const tools = [
  {
    type: "function",
    function: {
      name: "hitung_harga_jual",
      description:
        "Hitung harga jual dari modal per unit dan margin yang diinginkan. Margin adalah persen dari harga jual.",
      parameters: {
        type: "object",
        properties: {
          modal_per_unit: { type: "number", description: "Modal per unit dalam rupiah" },
          margin_persen: { type: "number", description: "Margin dari harga jual, 1 sampai 95" },
        },
        required: ["modal_per_unit", "margin_persen"],
      },
    },
  },
];

function hitungHargaJual(input) {
  const modal = Number(input?.modal_per_unit);
  const margin = Number(input?.margin_persen);
  if (!(modal > 0) || !(margin > 0) || margin >= 100) {
    return { error: "Modal harus lebih dari 0 dan margin antara 1 sampai 95 persen." };
  }
  const harga = modal / (1 - margin / 100);
  const hargaBulat = Math.ceil(harga / 500) * 500;
  return {
    harga_jual_tepat: Math.round(harga),
    harga_jual_dibulatkan_500: hargaBulat,
    laba_per_unit_dibulatkan: hargaBulat - modal,
    margin_dibulatkan_persen: Number((((hargaBulat - modal) / hargaBulat) * 100).toFixed(1)),
  };
}

export async function POST(req) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY tidak ditemukan" }, { status: 500 });
  }
  // Dibuat di sini (bukan di level file) supaya key yang hilang tidak membuat server crash.
  const openai = new OpenAI({ apiKey });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (isLimited(ip)) {
    return NextResponse.json(
      { error: "Batas mode coba tercapai. Masuk atau daftar untuk melanjutkan, atau coba lagi nanti." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const raw = Array.isArray(body?.messages) ? body.messages : [];
  const history = raw
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
    .slice(-MAX_TURNS * 2)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  const last = history[history.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return NextResponse.json({ error: "Tulis pertanyaanmu dulu." }, { status: 400 });
  }
  last.content = last.content.slice(0, MAX_CHARS);

  try {
    const msgs = [{ role: "system", content: SYSTEM }, ...history];

    for (let i = 0; i < 3; i++) {
      const res = await openai.chat.completions.create({
        model: MODEL,
        messages: msgs,
        tools,
        temperature: 0.7,
        max_tokens: 700,
      });

      const msg = res.choices?.[0]?.message;
      if (!msg) break;

      if (!msg.tool_calls?.length) {
        const reply = msg.content?.trim();
        return NextResponse.json({ reply: reply || "Maaf, coba tulis ulang pertanyaanmu." });
      }

      msgs.push(msg);
      for (const call of msg.tool_calls) {
        let result = { error: "Tool tidak dikenal." };
        if (call.type === "function" && call.function.name === "hitung_harga_jual") {
          try {
            result = hitungHargaJual(JSON.parse(call.function.arguments || "{}"));
          } catch {
            result = { error: "Argumen tidak valid." };
          }
        }
        msgs.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }
    return NextResponse.json({ reply: "Maaf, permintaan ini terlalu rumit untuk mode coba. Coba lebih sederhana." });
  } catch (err) {
    console.error("demo error", err);
    return NextResponse.json({ error: "Labain sedang sibuk. Coba lagi sebentar." }, { status: 500 });
  }
}