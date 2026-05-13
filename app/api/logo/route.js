import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

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

async function generateImage(prompt) {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: truncatePrompt(prompt),
    size: "1024x1024",
    quality: "medium",
    n: 1,
  });

  const item = result.data?.[0];
  if (!item) throw new Error("Tidak ada data gambar");

  // gpt-image-1 selalu mengembalikan b64_json
  const b64 = item.b64_json ?? item.url ?? null;
  if (!b64) throw new Error("Format respons tidak dikenali");

  // Jika b64_json: simpan ke public/tmp sebagai file PNG
  // agar tidak dikirim sebagai JSON payload besar
  if (item.b64_json) {
    const filename = `logo-${randomUUID()}.png`;
    const filepath = path.join(process.cwd(), "public", "tmp", filename);

    await writeFile(filepath, Buffer.from(item.b64_json, "base64"));

    return {
      url: `/tmp/${filename}`,
      model: "gpt-image-1",
    };
  }

  return { url: item.url, model: "gpt-image-1" };
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
- Deskripsikan SATU bentuk utama saja
- Sebutkan warna eksak (contoh: navy blue, forest green)
- Maksimal 150 karakter
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
      return Response.json({ error: `Field '${field}' tidak lengkap` }, { status: 500 });
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

  // Pastikan folder public/tmp ada
  try {
    const { mkdir } = await import("fs/promises");
    await mkdir(path.join(process.cwd(), "public", "tmp"), { recursive: true });
  } catch (_) {}

  let imageUrl = null;
  let imageError = null;
  let usedFallback = false;
  let modelUsed = null;

  try {
    ({ url: imageUrl, model: modelUsed } = await generateImage(primaryPrompt));
  } catch (primaryErr) {
    console.error("Primary prompt failed:", primaryErr?.message);

    const isContentPolicy =
      primaryErr?.message?.includes("content_policy") ||
      primaryErr?.message?.includes("safety") ||
      primaryErr?.message?.includes("rejected");

    if (isContentPolicy) {
      try {
        ({ url: imageUrl, model: modelUsed } = await generateImage(fallbackPrompt));
        usedFallback = true;
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr?.message);
        imageError = "Gambar gagal dibuat. Klik Generate Ulang untuk coba lagi.";
      }
    } else {
      imageError = `Gambar gagal: ${primaryErr?.message ?? "Error tidak diketahui"}`;
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