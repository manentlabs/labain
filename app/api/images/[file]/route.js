import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "images");

export async function GET(_req, { params }) {
  const { file } = await params;

  // Hanya nama file yang dibuat sendiri oleh aplikasi (mencegah path traversal)
  if (!/^[a-z-]+-[0-9a-f-]{36}\.png$/.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buf = await readFile(path.join(UPLOAD_DIR, file));
    return new Response(buf, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}