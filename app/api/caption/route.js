import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = withUsageCheck("caption", async (req, session) => {
  const { product, tone, platform, targetAudience, keyBenefit } = await req.json();

  if (!product?.trim()) {
    return Response.json({ error: "Nama produk wajib diisi" }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY tidak ditemukan" }, { status: 500 });
  }

  const platformGuide = {
    instagram: {
      format: "Buka dengan kalimat hook yang kuat di baris pertama (karena terpotong), gunakan line break untuk keterbacaan, sertakan call-to-action yang jelas, tambahkan 5–10 hashtag relevan di akhir (campuran populer dan niche).",
      maxLen: "1.500–2.000 karakter",
      emoji: "Gunakan emoji secara strategis untuk memperkuat pesan, bukan sekadar dekorasi.",
    },
    tiktok: {
      format: "Hook 1–2 kalimat yang langsung memancing rasa ingin tahu atau emosi. Sisakan ruang untuk teks video. Akhiri dengan CTA singkat.",
      maxLen: "100–150 karakter",
      emoji: "Minimal emoji, fokus pada kata yang powerful.",
    },
    facebook: {
      format: "Cerita pendek atau konteks relatable dulu (2–3 kalimat), baru masuk ke produk. Akhiri dengan pertanyaan atau CTA untuk meningkatkan komentar. Hashtag tidak perlu banyak, 2–3 saja.",
      maxLen: "400–800 karakter",
      emoji: "Emoji secukupnya, jangan berlebihan.",
    },
    shopee: {
      format: "Langsung ke manfaat utama dan keunggulan produk. Sertakan detail relevan (varian, ukuran, bahan jika ada). Gunakan bullet point (•) untuk fitur utama. Sisipkan kata kunci promosi bila relevan: COD tersedia, gratis ongkir, garansi, stok terbatas, resmi.",
      maxLen: "500–1.000 karakter",
      emoji: "Gunakan ✅ atau 🔥 untuk poin unggulan.",
    },
  };

  const toneGuide = {
    santai: "Bahasa sehari-hari yang hangat dan akrab seperti rekomendasi teman. Hindari terkesan menjual secara paksa.",
    profesional: "Bahasa formal namun tetap manusiawi. Tonjolkan kredibilitas, kualitas, dan kepercayaan.",
    lucu: "Humor ringan dan relatable — bisa pakai wordplay, situasi lucu sehari-hari, atau twist tak terduga. Tetap fokus pada produk.",
    promosi: "Energik dengan urgensi nyata (bukan palsu). Gunakan angka, penawaran spesifik, dan batas waktu/stok jika memungkinkan.",
  };

  const selectedPlatform = platform || "instagram";
  const selectedTone = tone || "santai";
  const pg = platformGuide[selectedPlatform] ?? platformGuide.instagram;
  const tg = toneGuide[selectedTone] ?? toneGuide.santai;

  const extraContext = [
    targetAudience ? `Target pembeli: ${targetAudience}` : null,
    keyBenefit ? `Keunggulan utama yang wajib ditonjolkan: ${keyBenefit}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Tulis caption marketing untuk produk berikut.

## Informasi Produk
Produk: ${product}
${extraContext}

## Platform: ${selectedPlatform.toUpperCase()}
- Format: ${pg.format}
- Panjang ideal: ${pg.maxLen}
- Penggunaan emoji: ${pg.emoji}

## Gaya Penulisan: ${selectedTone.toUpperCase()}
${tg}

## Struktur yang Harus Ada
1. **Hook** — kalimat pembuka yang langsung menarik perhatian (pertanyaan, fakta mengejutkan, atau pernyataan relatable)
2. **Isi** — manfaat nyata produk dari sudut pandang pembeli (bukan sekadar fitur)
3. **CTA** — ajakan bertindak yang spesifik dan jelas (beli, klik link, DM, kunjungi toko, dll.)
${selectedPlatform === "instagram" || selectedPlatform === "tiktok" ? "4. **Hashtag** — sesuai panduan platform di atas" : ""}

## Aturan Penulisan
- Tulis LANGSUNG captionnya — tanpa judul, label bagian, atau komentar tambahan
- Hindari kalimat klise seperti "produk terbaik", "kualitas terjamin", atau "harga terjangkau" tanpa konteks spesifik
- Buat pembaca merasa caption ini ditulis untuk mereka, bukan untuk semua orang
- Bahasa: Indonesia yang natural (boleh campur sedikit Inggris jika sesuai tren platform)`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Kamu adalah copywriter senior spesialis UMKM Indonesia dengan pengalaman di e-commerce dan media sosial. Kamu memahami psikologi konsumen lokal, tren bahasa gaul terkini, dan cara membuat konten yang menggerakkan orang untuk membeli — bukan sekadar caption yang terlihat bagus.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 700,
  });

  const caption = completion.choices?.[0]?.message?.content?.trim() ?? "";
  if (!caption) {
    return Response.json({ error: "Caption kosong dari OpenAI" }, { status: 500 });
  }

  return Response.json({ caption });
});