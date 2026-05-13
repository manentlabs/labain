import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

function truncatePrompt(prompt, maxChars = 900) {
  if (prompt.length <= maxChars) return prompt;
  return prompt.slice(0, maxChars).trimEnd();
}

// Coba dall-e-3, fallback ke dall-e-2 jika tidak tersedia
async function generateImage(prompt) {
  // — Percobaan 1: dall-e-3
  try {
    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt: truncatePrompt(prompt),
      size: "1024x1024",
      quality: "standard",
      style: "natural",
      n: 1,
    });
    return { url: result.data?.[0]?.url ?? null, model: "dall-e-3" };
  } catch (err3) {
    const msg = err3?.message ?? "";
    console.error("DALL-E 3 failed:", msg);

    // Hanya fallback jika memang model tidak tersedia / tier tidak cukup
    const isModelUnavailable =
      msg.includes("does not exist") ||
      msg.includes("model_not_found") ||
      msg.includes("unsupported") ||
      err3?.status === 404;

    if (!isModelUnavailable) throw err3; // Error lain (content policy, dll) — lempar
  }

  // — Percobaan 2: dall-e-2 (tersedia di semua tier)
  console.log("Falling back to dall-e-2...");
  const result2 = await openai.images.generate({
    model: "dall-e-2",
    prompt: truncatePrompt(prompt, 900), // dall-e-2 max 1000 chars
    size: "1024x1024",
    n: 1,
  });
  return { url: result2.data?.[0]?.url ?? null, model: "dall-e-2" };
}

export const POST = withUsageCheck("logo", async (req, session) => {
  const { namaUsaha, jenis, filosofi, gaya, warnaPrimer } = await req.json();

  if (!namaUsaha?.trim())
    return Response.json({ error: "Nama usaha wajib diisi" }, { status: 400 });
  if (!jenis?.trim())
    return Response.json({ error: "Jenis usaha wajib diisi" }, { status: 400 });
  if (!filosofi?.trim())
    return Response.json({ error: "Filosofi usaha wajib diisi" }, { status: 400 });
  if (!process.env.OPENAI_API_KEY)
    return Response.json({ error: "API Key tidak ditemukan" }, { status: 500 });

  const selectedGaya = gayaGuide[gaya] ?? gayaGuide.minimalis;

  // ── STEP 1: KONSEP LOGO ───────────────────────────────────────────────
  const conceptPrompt = `Kamu sedang merancang logo untuk UMKM berikut:

Nama Usaha: ${namaUsaha}
Jenis Usaha: ${jenis}
Filosofi pemilik: ${filosofi}
Gaya visual: ${selectedGaya.label} — ${selectedGaya.desc}
${warnaPrimer ? `Warna diinginkan: ${warnaPrimer}` : ""}

## Tugasmu
Rancang konsep logo yang:
1. Merepresentasikan esensi usaha ini secara unik — bukan logo generik
2. Mengandung SATU elemen visual utama (ikon simpel, bentuk geometris, atau modifikasi huruf)
3. Punya alasan desain yang bisa dijelaskan ke pemilik UMKM

## Larangan Keras
- JANGAN gradasi, bayangan, efek 3D, atau bevel
- JANGAN lebih dari 3 warna
- JANGAN elemen dekoratif tanpa makna

## Untuk promptImage — WAJIB ikuti aturan ini:
- Mulai dengan: "Flat vector logo of"
- Deskripsikan SATU bentuk utama saja (lingkaran, segitiga, daun, mangkok, dll)
- Sebutkan warna eksak (contoh: navy blue, forest green, warm red)
- Maksimal 150 karakter — singkat tapi spesifik
- JANGAN sebut nama brand atau nama orang
- JANGAN gunakan kata: realistic, photo, 3D, shadow, gradient

## Output JSON:
{
  "konsep": "Satu kalimat tentang representasi logo untuk ${namaUsaha}",
  "elemenVisual": "Elemen utama: bentuk/simbol yang dipilih dan maknanya",
  "palet": "2–3 warna spesifik beserta alasan singkat",
  "tipografi": "Karakter font yang direkomendasikan",
  "filosofiDesain": "2–3 kalimat bagaimana desain mencerminkan filosofi pemilik",
  "promptImage": "Flat vector logo of [SATU bentuk sederhana], [warna], white background, minimal, clean"
}`;

  let conceptData;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a world-class logo designer for small businesses. " +
            "Every design element must earn its place — nothing decorative, everything meaningful. " +
            "Your DALL-E prompts are short (under 150 chars), safe, and specific: one shape, exact colors, white background. " +
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

  const requiredFields = ["konsep", "elemenVisual", "palet", "tipografi", "filosofiDesain", "promptImage"];
  for (const field of requiredFields) {
    if (!conceptData[field])
      return Response.json({ error: `Field konsep '${field}' tidak lengkap` }, { status: 500 });
  }

  // ── STEP 2: GENERATE GAMBAR ───────────────────────────────────────────
  const qualitySuffix =
    `${selectedGaya.dalleSuffix}, isolated on pure white background, ` +
    "no gradients, no shadows, no 3D effects, professional branding";

  const primaryPrompt = `${conceptData.promptImage}, ${qualitySuffix}`;

  const primaryColor = warnaPrimer
    ? warnaPrimer.split(",")[0].trim()
    : conceptData.palet?.split(",")?.[0]?.trim() ?? "navy blue";

  const fallbackPrompt =
    `Flat vector logo for a ${jenis} business, single simple ${primaryColor} icon, ` +
    `${selectedGaya.dalleSuffix}, white background, no text, no gradients, no shadows, professional`;

  let imageUrl = null;
  let imageError = null;
  let usedFallback = false;
  let modelUsed = null;

  // — Coba primary prompt
  try {
    ({ url: imageUrl, model: modelUsed } = await generateImage(primaryPrompt));
  } catch (primaryErr) {
    console.error("Primary prompt failed:", primaryErr?.message);

    const isContentPolicy =
      primaryErr?.status === 400 ||
      primaryErr?.message?.includes("content_policy") ||
      primaryErr?.message?.includes("safety");

    if (isContentPolicy) {
      // — Coba fallback prompt (lebih aman, tanpa nama brand)
      try {
        console.log("Retrying with safe fallback prompt...");
        ({ url: imageUrl, model: modelUsed } = await generateImage(fallbackPrompt));
        usedFallback = true;
      } catch (fallbackErr) {
        console.error("Fallback prompt also failed:", fallbackErr?.message);
        imageError = "Gambar gagal dibuat. Klik Generate Ulang untuk coba lagi.";
      }
    } else {
      imageError = "Gambar gagal dibuat. Klik Generate Ulang untuk coba lagi.";
    }
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
      promptImage: usedFallback ? fallbackPrompt : primaryPrompt,
      image: imageUrl,
      modelUsed,
      ...(imageError && { imageError }),
      ...(usedFallback && { note: "Logo dibuat dengan prompt sederhana." }),
    },
  });
});