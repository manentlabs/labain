import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = withUsageCheck("logo", async (req, session) => {
  const { namaUsaha, jenis, filosofi, gaya, warnaPrimer } = await req.json();

  // ── VALIDASI ─────────────────────────────────────────────────────────
  if (!namaUsaha?.trim())
    return Response.json({ error: "Nama usaha wajib diisi" }, { status: 400 });
  if (!jenis?.trim())
    return Response.json({ error: "Jenis usaha wajib diisi" }, { status: 400 });
  if (!filosofi?.trim())
    return Response.json({ error: "Filosofi usaha wajib diisi" }, { status: 400 });
  if (!process.env.OPENAI_API_KEY)
    return Response.json({ error: "API Key tidak ditemukan" }, { status: 500 });

  // ── PANDUAN GAYA ──────────────────────────────────────────────────────
  const gayaGuide = {
    minimalis: {
      label: "Ultra-minimalist",
      desc: "Single geometric shape or lettermark. Absolute negative space. No more than 2 colors. Think Apple, Nike.",
      dalleSuffix: "ultra-minimalist flat vector logo, single clean shape, maximum negative space, 2 solid colors only",
    },
    modern: {
      label: "Modern & Bold",
      desc: "Strong typography, one geometric accent. Clean and confident.",
      dalleSuffix: "modern bold flat vector logo, strong clean typography, one geometric accent shape, limited color palette",
    },
    tradisional: {
      label: "Traditional & Warm",
      desc: "Inspired by local Indonesian craft motifs — simplified and stylized, not decorative.",
      dalleSuffix: "flat vector logo inspired by Indonesian traditional motifs, simplified and stylized, warm color palette, clean lines",
    },
    playful: {
      label: "Playful & Friendly",
      desc: "Rounded shapes, friendly character or icon, approachable feel.",
      dalleSuffix: "playful flat vector logo, rounded friendly shapes, simple character or icon, bright limited palette",
    },
  };

  const selectedGaya = gayaGuide[gaya] ?? gayaGuide.minimalis;

  // ── STEP 1: GENERATE KONSEP LOGO ─────────────────────────────────────
  const conceptPrompt = `Kamu sedang merancang logo untuk UMKM berikut:

Nama Usaha: ${namaUsaha}
Jenis Usaha: ${jenis}
Filosofi pemilik: ${filosofi}
Gaya visual yang diinginkan: ${selectedGaya.label} — ${selectedGaya.desc}
${warnaPrimer ? `Warna yang diinginkan pemilik: ${warnaPrimer}` : ""}

## Tugasmu
Rancang konsep logo yang:
1. Merepresentasikan esensi usaha ini — bukan logo generik untuk jenis usaha sejenis
2. Mengandung satu elemen visual utama (ikon simpel, bentuk geometris, atau modifikasi huruf)
3. Punya alasan desain yang jelas dan bisa dijelaskan ke pemilik UMKM

## Larangan Keras
- JANGAN gradasi (gradient)
- JANGAN bayangan (shadow/drop-shadow)  
- JANGAN efek 3D atau bevel
- JANGAN lebih dari 3 warna
- JANGAN elemen dekoratif yang tidak punya makna

## Output JSON
Balas HANYA JSON valid ini:
{
  "konsep": "Satu kalimat: apa yang direpresentasikan logo ini dan mengapa relevan untuk ${namaUsaha}",
  "elemenVisual": "Deskripsi elemen utama: bentuk, simbol, atau huruf yang dipilih — dan apa maknanya",
  "palet": "2–3 warna spesifik dalam format nama warna atau hex, beserta alasan singkat pemilihannya",
  "tipografi": "Rekomendasi karakter font (misal: sans-serif bold, slab serif, rounded) yang cocok untuk nama usaha ini",
  "filosofiDesain": "2–3 kalimat: bagaimana desain ini mencerminkan filosofi '${filosofi}' dari pemilik",
  "promptImage": "Prompt DALL-E 3 dalam Bahasa Inggris yang sangat spesifik: sebutkan nama bentuk, warna eksak, posisi elemen, gaya, dan background. Mulai dengan 'Flat vector logo of'"
}`;

  let conceptData;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a world-class logo designer specializing in minimalist brand identity for small businesses. " +
            "You believe every design element must earn its place — nothing decorative, everything meaningful. " +
            "Your DALL-E prompts are precise: you name exact shapes, colors, and positions so the AI renders exactly what you intend. " +
            "Reply only with valid JSON.",
        },
        { role: "user", content: conceptPrompt },
      ],
      temperature: 0.7,
      max_tokens: 900,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Respons konsep kosong");
    conceptData = JSON.parse(raw);
  } catch (err) {
    console.error("Concept generation error:", err);
    return Response.json({ error: "Gagal membuat konsep logo" }, { status: 500 });
  }

  // Validasi field konsep
  const requiredConceptFields = ["konsep", "elemenVisual", "palet", "tipografi", "filosofiDesain", "promptImage"];
  for (const field of requiredConceptFields) {
    if (!conceptData[field])
      return Response.json({ error: `Field konsep '${field}' tidak lengkap` }, { status: 500 });
  }

  // ── STEP 2: GENERATE GAMBAR LOGO ─────────────────────────────────────
  // Suffix wajib untuk memastikan output bersih dan cocok untuk logo
  const qualitySuffix =
    `${selectedGaya.dalleSuffix}, ` +
    "isolated on pure white background, no text unless specified, " +
    "no gradients, no shadows, no 3D effects, no decorative borders, " +
    "suitable for professional branding, scalable design";

  const finalImagePrompt = `${conceptData.promptImage}, ${qualitySuffix}`;

  let imageUrl = null;
  let imageError = null;

  try {
    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalImagePrompt,
      size: "1024x1024",
      quality: "standard",
      style: "natural", // "natural" lebih cocok untuk logo flat vs "vivid" yang dramatis
      n: 1,
    });
    imageUrl = image.data?.[0]?.url ?? null;
  } catch (imgErr) {
    console.error("DALL-E error:", imgErr);
    imageError = "Gambar gagal dibuat, namun konsep logo berhasil dihasilkan.";
  }

  return Response.json({
    logo: {
      namaUsaha,
      gaya: selectedGaya.label,
      konsep: conceptData.konsep,
      elemenVisual: conceptData.elemenVisual,
      palet: conceptData.palet,
      tipografi: conceptData.tipografi,
      filosofiDesain: conceptData.filosofiDesain,
      promptImage: finalImagePrompt,
      image: imageUrl,
      ...(imageError && { imageError }),
    },
  });
});