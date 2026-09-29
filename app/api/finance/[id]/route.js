import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserId } from "@/app/lib/getUserId";

// DELETE /api/finance/:id -> hapus satu catatan milik pengguna
export async function DELETE(_req, { params }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sesi berakhir. Silakan masuk lagi." }, { status: 401 });

  const { id } = await params; // aman di Next 14 (objek biasa) maupun Next 15 (Promise)
  // Filter userId memastikan pengguna hanya bisa menghapus catatannya sendiri.
  const { count } = await prisma.financeEntry.deleteMany({ where: { id, userId } });
  if (count === 0) return NextResponse.json({ error: "Catatan tidak ditemukan." }, { status: 404 });

  return NextResponse.json({ ok: true });
}