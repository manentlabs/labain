import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const styleGuide = {
  "product-clean": {
    label: "Clean Product Shot",
    background: "pure white or light grey seamless background",
    lighting: "soft diffused studio lighting, no harsh shadows",
    mood: "crisp, clinical, e-commerce ready",
    suffix: "white background product photography, soft box lighting, high-key, commercial catalog style",
  },
  "lifestyle": {
    label: "Lifestyle & Context",
    background: "natural lifestyle setting relevant to the product's use case",
    lighting: "warm natural light or golden hour ambiance",
    mood: "aspirational, relatable, real-world usage",
    suffix: "lifestyle product photography, natural ambient light, warm tones, shallow depth of field",
  },
  "premium-dark": {
    label: "Premium Dark Aesthetic",
    background: "dark charcoal, deep navy, or matte black surface",
    lighting: "dramatic side lighting or rim lighting, subtle reflections",
    mood: "luxury, exclusive, high-end brand",
    suffix: "dark luxury product photography, dramatic rim lighting, moody cinematic atmosphere, premium brand aesthetic",
  },
  "flat-lay": {
    label: "Flat Lay",
    background: "clean textured surface (marble, wood, linen) shot from directly above",
    lighting: "even diffused lighting, no hot spots",
    mood: "editorial, Instagram-ready, styled",
    suffix: "flat lay product photography, top-down aerial view, styled with minimal props, editorial aesthetic",
  },
  "outdoor-natural": {
    label: "Outdoor Natural",
    background: "outdoor environment relevant to the product",
    lighting: "natural sunlight, golden hour or soft overcast",
    mood: "fresh, organic, authentic",
    suffix: "outdoor natural light product photography, environment-contextual background, fresh authentic feel",
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

  const b64 = item.b64_json ?? item.url ?? null;
  if (!b64) throw new Error("Format respons tidak dikenali");

  if (item.b64_json) {
    const filename = `foto-produk-${randomUUID()}.png`;
    const filepath = path.join(process.cwd(), "public", "tmp", filename);

    await writeFile(filepath, Buffer.from(item.b64_json, "base64"));

    return {
      url: `/tmp/${filename}`,
      model: "gpt-image-1",
    };
  }

  return { url: item.url, model: "gpt-image-1" };
}

export const POST = withUsageCheck("photo", async (req, session) => {
  const formData = await req.formData();
  const file = formData.get("image");
  const styleKey = formData.get("style") || "product-clean";
  const targetPlatform = formData.get("platform") || "general";
  const additionalContext = formData.get("context") || "";

  if (!file)
    return Response.json({ error: "Gambar wajib diupload" }, { status: 400 });
  if (!process.env.OPENAI_API_KEY)
    return Response.json({ error: "API Key tidak ditemukan" }, { status: 500 });

  const selectedStyle = styleGuide[styleKey] ?? styleGuide["product-clean"];

  const mimeType = file.type?.startsWith("image/") ? file.type : "image/jpeg";
  const arrayBuffer = await file.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");

  // ── STEP 1: ANALISIS PRODUK DENGAN VISION ───────────────────────────
  let productAnalysis;
  try {
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a professional product photographer and creative director. " +
            "Your job is to analyze product images with extreme visual precision, " +
            "then write image generation prompts that faithfully recreate the product in a new setting. " +
            "Your prompts must be specific enough that the AI renders the correct product — not a generic substitute.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product image carefully and respond with a JSON object only. No markdown, no extra text.

{
  "productName": "Best guess of what this product is (brand + type if visible)",
  "shape": "Precise shape description: dimensions ratio, silhouette, container type",
  "colors": "Exact colors of the product, packaging, and labels — use specific color names (e.g. 'matte forest green', 'cream white')",
  "labels": "Any visible text, logos, or branding on the product — describe placement and style",
  "material": "Apparent material: glass, plastic, matte paper, shiny foil, etc.",
  "keyDetails": "Any unique visual identifiers that make this product distinct from similar products",
  "imagePrompt": "Write a precise image generation prompt in English to photograph this exact product in the following setting:\\n\\nStyle: ${selectedStyle.label}\\nBackground: ${selectedStyle.background}\\nLighting: ${selectedStyle.lighting}\\nMood: ${selectedStyle.mood}\\nPlatform: ${targetPlatform}\\n${additionalContext ? `Additional context: ${additionalContext}` : ""}\\n\\nStart the prompt with 'Professional product photography of' and include all specific visual details of the product before describing the setting. The product must look identical to the original."
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1200,
      temperature: 0.4,
    });

    const raw = visionResponse.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error("Respons vision kosong");

    const cleaned = raw.replace(/```json|```/g, "").trim();
    productAnalysis = JSON.parse(cleaned);
  } catch (err) {
    console.error("Vision analysis error:", err);
    return Response.json(
      { error: "Gagal menganalisis foto produk. Pastikan gambar jelas dan produk terlihat." },
      { status: 500 }
    );
  }

  if (!productAnalysis?.imagePrompt) {
    return Response.json(
      { error: "Analisis produk tidak lengkap, coba upload gambar yang lebih jelas." },
      { status: 422 }
    );
  }

  // ── STEP 2: GENERATE FOTO PRODUK BARU ───────────────────────────────
  const technicalSuffix =
    `${selectedStyle.suffix}, ` +
    "ultra sharp, product in perfect focus, photorealistic, " +
    "no text overlays, no watermarks, no people unless specified, " +
    "shot on professional camera, commercial advertising quality";

  const primaryPrompt = `${productAnalysis.imagePrompt}, ${technicalSuffix}`;

  // Fallback prompt jika primary gagal (misal: content policy)
  const fallbackPrompt =
    `Professional product photography of a ${productAnalysis.productName ?? "product"}, ` +
    `${selectedStyle.suffix}, isolated clean background, no text, photorealistic, commercial quality`;

  // Pastikan folder public/tmp ada
  try {
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
    result: {
      style: selectedStyle.label,
      platform: targetPlatform,
      product: {
        name: productAnalysis.productName,
        shape: productAnalysis.shape,
        colors: productAnalysis.colors,
        material: productAnalysis.material,
        keyDetails: productAnalysis.keyDetails,
      },
      prompt: usedFallback ? fallbackPrompt : primaryPrompt,
      image: imageUrl,
      modelUsed,
      ...(imageError && { imageError }),
      ...(usedFallback && { note: "Foto dibuat dengan prompt sederhana." }),
    },
  });
});