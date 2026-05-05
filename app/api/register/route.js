import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { sendVerificationEmail } from "@/app/lib/mail";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔐 token
    const verifyToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ create user + verification
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        verifications: {
          create: {
            token: verifyToken,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
          },
        },
      },
    });

    const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${verifyToken}`;

    // 📧 kirim email (safe)
    try {
      await sendVerificationEmail(email, verifyLink);
    } catch (err) {
      console.error("EMAIL ERROR:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Akun berhasil dibuat. Silakan cek email untuk verifikasi.",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}