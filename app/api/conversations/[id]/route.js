import { prisma } from "@/app/lib/prisma";
import { getSessionUserId } from "@/app/lib/getUserId";

export const dynamic = "force-dynamic";

// Isi satu percakapan (pesan urut dari yang terlama).
export async function GET(_req, { params }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, images: true, hasAttachment: true },
      },
    },
  });

  if (!conversation) {
    return Response.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
  }
  return Response.json(conversation);
}

// Hapus percakapan beserta pesannya. Catatan keuangan tetap tersimpan.
export async function DELETE(_req, { params }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const { id } = await params;
  const { count } = await prisma.conversation.deleteMany({ where: { id, userId } });

  if (count === 0) {
    return Response.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
  }
  return Response.json({ ok: true });
}