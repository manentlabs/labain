import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = withUsageCheck("photo", async (req, session) => {
  const formData = await req.formData();
  const file = formData.get("image");
  const style = formData.get("style") || "professional product advertising";

  if (!file) return Response.json({ error: "Gambar wajib diupload" }, { status: 400 });

  // Konversi file ke Base64 agar bisa dibaca GPT-4o Vision
  const arrayBuffer = await file.arrayBuffer();
  const base64Image = Buffer.from(arrayBuffer).toString("base64");

  try {
    // 1. Minta AI menganalisis produk di foto tersebut
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o", // Gunakan gpt-4o untuk kemampuan vision
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Describe this product in extreme detail for a professional photoshoot. Focus on the object shape, color, and labels. Then, create a DALL-E prompt to place this exact product in a ${style} setting with studio lighting and premium aesthetic.` },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
    });

    const dallEPrompt = visionResponse.choices[0].message.content;

    // 2. Generate gambar baru dengan DALL-E 3
    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt: dallEPrompt,
      size: "1024x1024",
      quality: "hd",
    });

    return Response.json({
      result: {
        prompt: dallEPrompt,
        image: result.data[0].url,
      },
    });

  } catch (err) {
    console.error("Proses Gagal:", err);
    return Response.json({ error: "Gagal memproses foto produk" }, { status: 500 });
  }
});