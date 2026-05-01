import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = withUsageCheck("caption", async (req, session) => {
  const { product, tone, platform } = await req.json();

  if (!product?.trim()) {
    return Response.json({ error: "Nama produk wajib diisi" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY tidak ditemukan" }, { status: 500 });
  }

  const platformGuide = {
    instagram: "Gunakan emoji yang relevan, maksimal 2200 karakter, sertakan 5-10 hashtag populer di akhir.",
    tiktok: "Singkat dan energik, maksimal 150 karakter, pakai 3-5 hashtag trending.",
    facebook: "Lebih panjang dan informatif, bisa berupa storytelling, tanpa terlalu banyak hashtag.",
    shopee: "Fokus pada keunggulan produk dan ajakan beli. Gunakan kata-kata promosi seperti 'COD', 'gratis ongkir', 'stok terbatas'.",
  };

  const toneGuide = {
    santai: "bahasa santai, akrab, seperti ngobrol sama teman",
    profesional: "bahasa formal dan profesional, tepercaya",
    lucu: "humor ringan, playful, bikin senyum",
    promosi: "agresif promosi, urgensi tinggi, dorong pembeli untuk segera beli",
  };

  const prompt = `Buat caption marketing untuk produk berikut:

Produk: ${product}
Platform: ${platform || "instagram"} — ${platformGuide[platform] ?? ""}
Gaya penulisan: ${tone || "santai"} — ${toneGuide[tone] ?? ""}

Ketentuan:
- Tulis langsung captionnya, tanpa pembuka atau penjelasan tambahan
- Sesuaikan panjang dan format dengan platform
- Jadikan semenarik dan senatural mungkin`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Kamu adalah copywriter handal untuk UMKM Indonesia. Tugasmu menulis caption marketing yang menarik, natural, dan sesuai platform.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.85,
    max_tokens: 600,
  });

  const caption = completion.choices?.[0]?.message?.content?.trim() ?? "";

  if (!caption) {
    return Response.json({ error: "Caption kosong dari OpenAI" }, { status: 500 });
  }

  return Response.json({ caption });
});