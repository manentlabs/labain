import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/app/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            isVerified: true,
          },
        });

        if (!user) throw new Error("Email tidak ditemukan");
        if (!user.isVerified) throw new Error("Email belum diverifikasi");
        if (user.password === "GOOGLE_LOGIN") throw new Error("Gunakan login Google");
        if (!user.password) throw new Error("Akun tidak valid");

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) throw new Error("Password salah");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          hasPassword: true, // ← credentials selalu punya password
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!existing) {
          await prisma.user.create({
            data: {
              name: user.name,
              email: user.email,
              password: "GOOGLE_LOGIN",
              isVerified: true,
            },
          });
        }
        user.hasPassword = false; // ← Google tidak punya password
      }
      return true;
    },

    async jwt({ token, user }) {
      // user hanya ada saat pertama login
      if (user) {
        token.hasPassword = user.hasPassword ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, plan: true, planExpiry: true },
        });
        session.user.id = dbUser?.id;
        session.user.plan = dbUser?.plan;
        session.user.hasPassword = token.hasPassword ?? false; // ← inject ke session
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };