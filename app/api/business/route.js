import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionUserId } from "@/app/lib/getUserId";

// Batas panjang mengikuti skema: String = VARCHAR(191), @db.Text = TEXT.
const LIMITS = {
  name: 100,
  category: 100,
  description: 1000,
  products: 1000,
  targetCustomer: 191,
  location: 100,
  channels: 191,
  tone: 100,
};
const FIELDS = Object.keys(LIMITS);

const unauthorized = () =>
  NextResponse.json({ error: "Sesi berakhir. Silakan masuk lagi." }, { status: 401 });

// GET /api/business -> { business | null }
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const business = await prisma.business.findUnique({
    where: { userId },
    select: {
      name: true,
      category: true,
      description: true,
      products: true,
      targetCustomer: true,
      location: true,
      channels: true,
      tone: true,
    },
  });
  return NextResponse.json({ business });
}

// PUT /api/business -> buat atau perbarui profil usaha
export async function PUT(req) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const data = {};
  for (const f of FIELDS) {
    const raw = body[f];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value.length > LIMITS[f]) {
      return NextResponse.json({ error: `Isian terlalu panjang (maks ${LIMITS[f]} karakter).` }, { status: 400 });
    }
    data[f] = value || null;
  }
  if (!data.name) {
    return NextResponse.json({ error: "Nama usaha wajib diisi." }, { status: 400 });
  }

  const business = await prisma.business.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return NextResponse.json({ business });
}