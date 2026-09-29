import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getTodayUsage } from "@/app/lib/usage";
import { PLANS, getActivePlan } from "@/app/lib/plan";

// GET /api/user/plan → paket aktif + pemakaian hari ini
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, planExpiry: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const activePlan = getActivePlan(user);
    const usage = await getTodayUsage(session.user.id);

    return NextResponse.json({
      plan: activePlan,
      planLabel: PLANS[activePlan].label,
      // Paket gratis tidak punya masa aktif; paket kedaluwarsa juga tidak ditampilkan
      planExpiry: activePlan === "FREE" ? null : user.planExpiry,
      usage,
    });
  } catch (err) {
    console.error("GET /api/user/plan error:", err?.message ?? err);
    return NextResponse.json({ error: "Gagal memuat paket" }, { status: 500 });
  }
}