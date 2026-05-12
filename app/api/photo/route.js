import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Panduan gaya foto per konteks
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

export const POST = withUsageCheck("photo", async (req, session) => {
  const formData = await req.formData();
  const file = formData.get("image");
  const styleKey = formData.get("style") || "product-clean";
  const targetPlatform = formData.get("platform") || "general"; // shopee, instagram, tokopedia, general
  const additionalContext = formData.get("context") || ""; // misal: "produk untuk ibu hamil", "target pasar anak muda"

  if (!file)
    return Response.json({ error: "Gambar wajib diupload" }, { status: 400 });
  if (!process.env.OPENAI_API_KEY)
    return Response.json({ error: "API Key tidak ditemukan" }, { status: 500 });

  const selectedStyle = styleGuide[styleKey] ?? styleGuide["product-clean"];

  // Deteksi MIME type dari file untuk menghindari asumsi jpeg
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
            "then write DALL-E 3 prompts that faithfully recreate the product in a new setting. " +
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
  "dallEPrompt": "Write a precise DALL-E 3 prompt in English to photograph this exact product in the following setting:\\n\\nStyle: ${selectedStyle.label}\\nBackground: ${selectedStyle.background}\\nLighting: ${selectedStyle.lighting}\\nMood: ${selectedStyle.mood}\\nPlatform: ${targetPlatform}\\n${additionalContext ? `Additional context: ${additionalContext}` : ""}\\n\\nStart the prompt with 'Professional product photography of' and include all specific visual details of the product before describing the setting. The product must look identical to the original."
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high", // Minta analisis resolusi tinggi
              },
            },
          ],
        },
      ],
      max_tokens: 1200,
      temperature: 0.4, // Rendah untuk analisis yang konsisten dan akurat
    });

    const raw = visionResponse.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error("Respons vision kosong");

    // Bersihkan jika model tetap membungkus dengan markdown
    const cleaned = raw.replace(/```json|```/g, "").trim();
    productAnalysis = JSON.parse(cleaned);
  } catch (err) {
    console.error("Vision analysis error:", err);
    return Response.json(
      { error: "Gagal menganalisis foto produk. Pastikan gambar jelas dan produk terlihat." },
      { status: 500 }
    );
  }

  if (!productAnalysis?.dallEPrompt) {
    return Response.json(
      { error: "Analisis produk tidak lengkap, coba upload gambar yang lebih jelas." },
      { status: 422 }
    );
  }

  // ── STEP 2: GENERATE FOTO PRODUK BARU ───────────────────────────────
  // Tambahkan suffix teknis wajib untuk kualitas foto produk
  const technicalSuffix =
    `${selectedStyle.suffix}, ` +
    "8K ultra sharp, product in perfect focus, photorealistic, " +
    "no text overlays, no watermarks, no people unless specified, " +
    "shot on professional camera, commercial advertising quality";

  const finalPrompt = `${productAnalysis.dallEPrompt}, ${technicalSuffix}`;

  let imageUrl = null;
  let imageError = null;

  try {
    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      size: "1024x1024",
      quality: "hd",
      style: "natural", // "natural" lebih realistis untuk foto produk vs "vivid" yang terlalu dramatis
      n: 1,
    });
    imageUrl = result.data?.[0]?.url ?? null;
  } catch (imgErr) {
    console.error("DALL-E error:", imgErr);
    imageError = "Gagal generate gambar. Analisis produk berhasil — coba lagi untuk membuat foto.";
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
      prompt: finalPrompt,
      image: imageUrl,
      ...(imageError && { imageError }),
    },
  });
});