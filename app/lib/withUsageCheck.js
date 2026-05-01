import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkUsage, incrementUsage } from "@/app/lib/usage";
import { NextResponse } from "next/server";

/**
 * HOF: bungkus route handler dengan pengecekan usage otomatis
 *
 * Cara pakai:
 *   export const POST = withUsageCheck("caption", async (req, session) => {
 *     // logika generate di sini
 *     return NextResponse.json({ result: "..." });
 *   });
 */
export function withUsageCheck(feature, handler) {
  return async function (req, ctx) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { allowed, used, limit, reason } = await checkUsage(session.user.id, feature);

    if (!allowed) {
      return NextResponse.json(
        { error: reason, used, limit },
        { status: 403 }
      );
    }

    // Jalankan handler asli
    const response = await handler(req, session, ctx);

    // Increment usage hanya jika berhasil (status 2xx)
    if (response.status >= 200 && response.status < 300) {
      await incrementUsage(session.user.id, feature);
    }

    return response;
  };
}