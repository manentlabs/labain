import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/app/lib/prisma";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  events: {
    async signIn({ user }) {
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (!existing) {
        await prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            password: "GOOGLE_LOGIN",
          },
        });
      }
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, plan: true, planExpiry: true },
        });
        session.user.id = dbUser?.id;
        session.user.plan = dbUser?.plan;
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