import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserId } from "@/app/lib/getUserId";

// GET /api/finance?month=YYYY-MM -> { entries }
export async function GET(req) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sesi berakhir. Silakan masuk lagi." }, { status: 401 });

  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(req.nextUrl.searchParams.get("month") ?? "");
  if (!match) return NextResponse.json({ error: "Format bulan harus YYYY-MM." }, { status: 400 });
  const year = Number(match[1]);
  const month = Number(match[2]);

  // entryDate bertipe DATE (tanpa jam), jadi batas bulan dihitung dalam UTC.
  const entries = await prisma.financeEntry.findMany({
    where: {
      userId,
      entryDate: {
        gte: new Date(Date.UTC(year, month - 1, 1)),
        lt: new Date(Date.UTC(year, month, 1)),
      },
    },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      category: true,
      quantity: true,
      unitPrice: true,
      entryDate: true,
    },
  });

  return NextResponse.json({ entries });
}