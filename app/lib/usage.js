import { prisma } from "@/app/lib/prisma";
import { getDailyLimit, canAccessFeature } from "@/app/lib/plan";

/**
 * Ambil tanggal hari ini dalam format YYYY-MM-DD (WIB)
 */
function today() {
  return new Date()
    .toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
}

/**
 * Cek apakah user masih bisa generate hari ini
 * @returns {{ allowed: boolean, used: number, limit: number, reason?: string }}
 */
export async function checkUsage(userId, feature) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiry: true },
  });

  if (!user) return { allowed: false, used: 0, limit: 0, reason: "User tidak ditemukan" };

  // Cek plan masih aktif
  const plan = user.planExpiry && user.planExpiry < new Date() ? "FREE" : user.plan;

  // Cek akses fitur
  if (!canAccessFeature(plan, feature)) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      reason: `Fitur ini tidak tersedia di plan ${plan}. Upgrade untuk mengakses.`,
    };
  }

  const limit = getDailyLimit(plan, feature);
  const dateStr = today();

  const usage = await prisma.usage.findUnique({
    where: { userId_feature_date: { userId, feature, date: dateStr } },
  });

  const used = usage?.count ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Limit harian tercapai (${used}/${limit}). Coba lagi besok atau upgrade plan.`,
    };
  }

  return { allowed: true, used, limit };
}

/**
 * Tambah 1 usage setelah berhasil generate
 */
export async function incrementUsage(userId, feature) {
  const dateStr = today();

  await prisma.usage.upsert({
    where: { userId_feature_date: { userId, feature, date: dateStr } },
    update: { count: { increment: 1 } },
    create: { userId, feature, date: dateStr, count: 1 },
  });
}

/**
 * Ambil semua usage hari ini untuk satu user (untuk ditampilkan di UI)
 */
export async function getTodayUsage(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiry: true },
  });

  if (!user) return null;

  const plan = user.planExpiry && user.planExpiry < new Date() ? "FREE" : user.plan;
  const dateStr = today();

  const usages = await prisma.usage.findMany({
    where: { userId, date: dateStr },
  });

  const usageMap = {};
  for (const u of usages) {
    usageMap[u.feature] = u.count;
  }

  const { getDailyLimit: getLimit } = await import("@/app/lib/plan");
  const features = ["caption", "profile", "logo", "photo"];

  return features.map((feature) => ({
    feature,
    used: usageMap[feature] ?? 0,
    limit: getLimit(plan, feature),
  }));
}