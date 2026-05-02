import { prisma } from "@/app/lib/prisma";
import HomeClient from "@/app/components/HomeClient";

const MINUTES_SAVED_PER_FEATURE: Record<string, number> = {
  caption: 18,
  photo: 57,
  logo: 120,
  profile: 45,
  default: 20,
};

// Fungsi fetch stats langsung dari DB (jalan di server)
async function getStats() {
  try {
    const [totalUsers, usageAgg, activeUmkm, usageByFeature] = await Promise.all([
      prisma.user.count(),
      prisma.usage.aggregate({ _sum: { count: true } }),
      prisma.usage.groupBy({ by: ["userId"], _count: { userId: true } }),
      // Ambil total count per fitur untuk kalkulasi hemat waktu
      prisma.usage.groupBy({
        by: ["feature"],
        _sum: { count: true },
      }),
    ]);

    const totalContent = usageAgg._sum.count ?? 0;

    // Hitung total menit dihemat berdasarkan fitur yang dipakai
    const totalMinutesSaved = usageByFeature.reduce(
    (acc: number, row: any) => {
      const featureName = row.feature.toLowerCase();
      const minutesPerUse =
        MINUTES_SAVED_PER_FEATURE[featureName] ??
        MINUTES_SAVED_PER_FEATURE.default;
      return acc + (row._sum.count ?? 0) * minutesPerUse;
    }, 0);

    // Konversi ke jam, bulatkan ke bawah
    const totalHoursSaved = Math.floor(totalMinutesSaved / 60);

    return {
      totalUsers,
      totalContent,
      totalUmkm: activeUmkm.length,
      totalHoursSaved,
    };
  } catch (error) {
    console.error("Stats fetch error:", error);
    return { totalUsers: 0, totalContent: 0, totalUmkm: 0, totalHoursSaved: 0 };
  }
}

// Format angka: 12400 → "12.4K", 98000 → "98K+"
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("id-ID");
}

export default async function Home() {
  const { totalUsers, totalContent, totalUmkm, totalHoursSaved } = await getStats();

  const stats = [
    {
      label: "Pengguna Aktif",
      value: formatNumber(totalUsers),
      icon: "👥",
    },
    {
      label: "Konten Dibuat",
      value: `${formatNumber(totalContent)}+`,
      icon: "✨",
    },
    {
      label: "UMKM Terbantu",
      value: formatNumber(totalUmkm),
      icon: "🏪",
    },
    {
      label: "Jam Dihemat",
      value: `${formatNumber(totalHoursSaved)}+`,
      icon: "⚡",
    },
  ];

  return <HomeClient stats={stats} />;
}