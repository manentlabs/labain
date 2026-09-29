import { prisma } from "@/app/lib/prisma";
import { PLANS, getActivePlan, getDailyLimit, canAccessFeature } from "@/app/lib/plan";

/** Tanggal hari ini format YYYY-MM-DD (WIB) */
function today() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
}

async function getUserPlan(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiry: true },
  });
  return user ? getActivePlan(user) : null;
}

/**
 * Pesan 1 jatah pemakaian secara atomik SEBELUM pekerjaan dijalankan.
 * Aman untuk request paralel: hanya request yang benar-benar masih punya jatah yang lolos.
 * @returns {{ allowed: boolean, used: number, limit: number, reason?: string, reserved?: boolean }}
 */
export async function reserveUsage(userId, feature) {
  const plan = await getUserPlan(userId);
  if (!plan) return { allowed: false, used: 0, limit: 0, reason: "User tidak ditemukan" };

  if (!canAccessFeature(plan, feature)) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      reason: `Fitur ini tidak tersedia di plan ${PLANS[plan].label}. Upgrade untuk mengakses.`,
    };
  }

  const limit = getDailyLimit(plan, feature);
  const date = today();
  const key = { userId, feature, date };

  // Pastikan barisnya ada. Kalau dua request membuatnya bersamaan, yang kalah cukup diabaikan.
  try {
    await prisma.usage.upsert({
      where: { userId_feature_date: key },
      update: {},
      create: { ...key, count: 0 },
    });
  } catch (err) {
    if (err?.code !== "P2002") throw err;
  }

  // Naikkan hitungan hanya jika masih di bawah limit (satu query atomik)
  const res = await prisma.usage.updateMany({
    where: { ...key, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });

  if (res.count === 0) {
    const row = await prisma.usage.findUnique({ where: { userId_feature_date: key } });
    const used = row?.count ?? limit;
    return {
      allowed: false,
      used,
      limit,
      reason: `Limit harian tercapai (${used}/${limit}). Coba lagi besok atau upgrade plan.`,
    };
  }

  return { allowed: true, used: 0, limit, reserved: true };
}

/** Kembalikan jatah yang sudah dipesan (dipanggil kalau pekerjaan gagal) */
export async function refundUsage(userId, feature) {
  await prisma.usage.updateMany({
    where: { userId, feature, date: today(), count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

/** Pemakaian hari ini untuk ditampilkan di UI: [{ feature, used, limit }] */
export async function getTodayUsage(userId) {
  const plan = await getUserPlan(userId);
  if (!plan) return [];

  const rows = await prisma.usage.findMany({ where: { userId, date: today() } });
  const usedMap = Object.fromEntries(rows.map((r) => [r.feature, r.count]));

  return Object.entries(PLANS[plan].limits)
    .filter(([, limit]) => limit > 0) // fitur yang tidak tersedia tidak ditampilkan
    .map(([feature, limit]) => ({
      feature,
      used: Math.min(usedMap[feature] ?? 0, limit),
      limit,
    }));
}