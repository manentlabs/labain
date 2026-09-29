import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { reserveUsage, refundUsage } from "@/app/lib/usage";
import { NextResponse } from "next/server";

/**
 * Bungkus route handler dengan pembatasan pemakaian harian.
 *
 *   export const POST = withUsageCheck("caption", async (req, session, ctx) => {
 *     return NextResponse.json({ result: "..." });
 *   });
 *
 * Jatah dipesan dulu, dan dikembalikan jika handler gagal (non-2xx atau error).
 */
export function withUsageCheck(feature, handler) {
  return async function (req, ctx) {
    let session;
    let reserved = false;

    try {
      session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
      }

      const r = await reserveUsage(session.user.id, feature);
      if (!r.allowed) {
        return NextResponse.json({ error: r.reason, used: r.used, limit: r.limit }, { status: 403 });
      }
      reserved = true;

      const response = await handler(req, session, ctx);

      if (!(response?.status >= 200 && response.status < 300)) {
        await refundUsage(session.user.id, feature).catch(() => {});
      }
      return response;
    } catch (err) {
      console.error(`withUsageCheck error (${feature}):`, err?.message ?? err);
      if (reserved) await refundUsage(session.user.id, feature).catch(() => {});
      return NextResponse.json({ error: "Terjadi kesalahan. Coba lagi." }, { status: 500 });
    }
  };
}