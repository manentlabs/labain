import { prisma } from "@/app/lib/prisma";

export async function GET(_req, { params }) {
  const { file } = await params;

  // Hanya id yang dibuat aplikasi (huruf kecil dan angka)
  if (!/^[a-z0-9]{20,40}$/.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const img = await prisma.image.findUnique({
      where: { id: file },
      select: { data: true },
    });
    if (!img) return new Response("Not found", { status: 404 });

    return new Response(new Uint8Array(img.data), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Image route error:", err?.message ?? err);
    return new Response("Error", { status: 500 });
  }
}