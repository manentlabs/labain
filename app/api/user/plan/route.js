import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";
import { getTodayUsage } from "@/app/lib/usage";
import { PLANS } from "@/app/lib/plan";
import { NextResponse } from "next/server";

// GET /api/user/plan  → ambil plan + usage hari ini
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, planExpiry: true },
  });

  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  // Downgrade ke FREE jika plan kadaluarsa
  const activePlan = user.planExpiry && user.planExpiry < new Date() ? "FREE" : user.plan;

  const usage = await getTodayUsage(session.user.id);

  return NextResponse.json({
    plan: activePlan,
    planLabel: PLANS[activePlan].label,
    planExpiry: user.planExpiry,
    features: PLANS[activePlan].features,
    usage,
  });
}

// PATCH /api/user/plan  → update plan user (dari webhook payment atau admin)
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { plan, durationDays } = body;

  if (!["FREE", "STARTER", "PRO"].includes(plan)) {
    return NextResponse.json({ error: "Plan tidak valid" }, { status: 400 });
  }

  const planExpiry = plan === "FREE"
    ? null
    : new Date(Date.now() + (durationDays ?? 30) * 24 * 60 * 60 * 1000);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { plan, planExpiry },
    select: { plan: true, planExpiry: true },
  });

  return NextResponse.json({ success: true, ...updated });
}