import { prisma } from "@/app/lib/prisma";
import { getSessionUserId } from "@/app/lib/getUserId";

export const dynamic = "force-dynamic";

// Daftar riwayat: 50 percakapan terbaru milik pengguna.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true },
  });

  return Response.json({ conversations });
}