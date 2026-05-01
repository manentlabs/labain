import { prisma } from "@/app/lib/prisma";
import RegisterClient from "@/app/components/RegisterClient";

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("id-ID");
}

async function getTotalUsers() {
  try {
    const count = await prisma.user.count();
    return count;
  } catch {
    return 0;
  }
}

export default async function RegisterPage() {
  const totalUsers = await getTotalUsers();
  const formattedUsers = formatNumber(totalUsers);

  return <RegisterClient totalUsers={formattedUsers} />;
}