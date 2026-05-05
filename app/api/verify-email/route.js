import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET);

    await prisma.user.update({
      where: { email },
      data: { isVerified: true }, // ✅ sesuai schema
    });

    return NextResponse.redirect(new URL("/verify-email?success=true", req.url));
  } catch (err) {
    console.error("Verify error:", err.message); // ✅ log error
    return NextResponse.redirect(new URL("/verify-email?error=expired", req.url));
  }
}