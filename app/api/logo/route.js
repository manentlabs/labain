import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = withUsageCheck("logo", async (req, session) => {
  const { namaUsaha, jenis, filosofi } = await req.json();

  // ── VALIDASI ─────────────────────────────
  if (!namaUsaha?.trim() || !jenis?.trim() || !filosofi?.trim())
    return Response.json({ error: "Data wajib diisi lengkap" }, { status: 400 });

  if (!process.env.OPENAI_API_KEY)
    return Response.json({ error: "API Key tidak ditemukan" }, { status: 500 });

  try {
    // ── 1. GENERATE KONSEP LOGO (Ultra Minimalist Instruction) ──
    const promptText = `
Buat konsep branding logo yang sangat MINIMALIS untuk UMKM:

Nama Usaha: ${namaUsaha}
Jenis Usaha: ${jenis}
Filosofi: ${filosofi}

KRITERIA LOGO WAJIB:
- Gaya: Ultra-minimalist, flat design, modern.
- Elemen: Maksimal hanya 1 ikon simpel atau modifikasi huruf (logotype).
- Larangan: JANGAN ada gradasi, JANGAN ada bayangan (shadows), JANGAN ada detail kecil yang rumit, JANGAN ada efek 3D.
- Warna: Solid dan terbatas (maksimal 2-3 warna).

Berikan JSON:
{
  "konsep": "Penjelasan singkat 1 kalimat",
  "filosofi": "Makna sederhana dari elemen",
  "deskripsi": "Deskripsi visual",
  "promptImage": "Prompt DALL-E dalam Bahasa Inggris yang sangat spesifik untuk logo simpel"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Kamu adalah desainer logo minimalis kelas dunia seperti desainer Apple atau Nike. Kamu percaya bahwa 'less is more'. Jawab hanya JSON valid.",
        },
        { role: "user", content: promptText },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content;
    const data = JSON.parse(raw);

    // ── 2. PROMPT IMAGE LOGO (Disederhanakan Maksimal) ──────────
    // Kita menambahkan paksaan instruksi "Vector" dan "White Background"
    const minimalistSuffix = "minimalist vector logo, flat design, solid colors, clean lines, simple geometric shape, isolated on white background, no shading, only 2D, professional branding";
    
    const imagePrompt = `${data.promptImage}, ${minimalistSuffix}`;

    let imageUrl = null;

    try {
      const image = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });

      imageUrl = image.data?.[0]?.url || null;
    } catch (imgErr) {
      console.error("DALL-E Error:", imgErr);
    }

    return Response.json({
      logo: {
        ...data,
        promptImage: imagePrompt,
        image: imageUrl,
      },
    });

  } catch (err) {
    console.error("API Error:", err);
    return Response.json({ error: "Gagal generate logo" }, { status: 500 });
  }
});