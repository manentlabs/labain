import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { snap } from "@/app/lib/midtrans";
import { syncTransaction } from "@/app/lib/payment";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orderId = new URL(req.url).searchParams.get("order_id");
  if (!orderId) {
    return Response.json({ error: "order_id is required" }, { status: 400 });
  }

  // Hanya pemilik order yang boleh mengecek
  const trx = await prisma.transaction.findUnique({ where: { order_id: orderId } });
  if (!trx || trx.user_id !== session.user.id) {
    return Response.json({ error: "Order tidak ditemukan" }, { status: 404 });
  }

  try {
    const midtrans = await snap.transaction.status(orderId);
    const status = await syncTransaction(orderId, midtrans);

    return Response.json({
      order_id: orderId,
      transaction_status: midtrans.transaction_status,
      status, // SUCCESS | FAILED | PENDING | REVIEW
    });
  } catch (error) {
    // 404 dari Midtrans = user belum memilih metode bayar, anggap masih menunggu
    if (Number(error?.httpStatusCode) === 404) {
      return Response.json({ order_id: orderId, transaction_status: "pending", status: "PENDING" });
    }
    console.error("Status check error:", error?.ApiResponse ?? error?.message ?? error);
    return Response.json({ error: "Gagal mengecek status" }, { status: 500 });
  }
}