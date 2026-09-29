import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth"; // sesuaikan dengan lokasi authOptions-mu
import { prisma } from "@/app/lib/prisma";

// Dipakai di route yang sudah punya objek session (mis. dari withUsageCheck).
// Memakai session.user.id kalau ada, kalau tidak dicari lewat email.
export async function resolveUserId(session) {
  if (session?.user?.id) return session.user.id;

  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

// Dipakai di route biasa yang belum punya session.
export async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  return resolveUserId(session);
}