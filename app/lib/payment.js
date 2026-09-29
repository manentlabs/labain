import { prisma } from "@/app/lib/prisma";

const PLAN_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Ubah status Midtrans menjadi SUCCESS | FAILED | PENDING */
export function mapStatus(m) {
  const t = m.transaction_status;
  const fraud = m.fraud_status;
  if (t === "settlement" || (t === "capture" && (!fraud || fraud === "accept"))) return "SUCCESS";
  if (["cancel", "deny", "expire", "failure"].includes(t)) return "FAILED";
  return "PENDING";
}

/**
 * Cocokkan transaksi di database dengan status dari Midtrans dan aktifkan paket bila lunas.
 * Aman dipanggil berulang (status route dan webhook bisa datang bersamaan).
 * @returns {Promise<"SUCCESS"|"FAILED"|"PENDING"|"REVIEW"|null>} null jika order tidak ada
 */
export async function syncTransaction(orderId, midtrans) {
  const trx = await prisma.transaction.findUnique({ where: { order_id: orderId } });
  if (!trx) return null;

  const next = mapStatus(midtrans);

  if (next === "SUCCESS") {
    // Pastikan nominal yang dibayar sama dengan harga paket
    if (Math.round(Number(midtrans.gross_amount)) !== trx.amount) {
      console.error("Nominal tidak cocok", orderId, midtrans.gross_amount, trx.amount);
      await prisma.transaction.updateMany({
        where: { order_id: orderId, status: "PENDING" },
        data: { status: "REVIEW" },
      });
      return "REVIEW";
    }

    await prisma.$transaction(async (tx) => {
      // Klaim atomik: hanya satu pemanggil yang lolos untuk order yang sama
      const claimed = await tx.transaction.updateMany({
        where: { order_id: orderId, status: { in: ["PENDING", "FAILED"] } },
        data: { status: "SUCCESS" },
      });
      if (claimed.count === 0) return;

      const user = await tx.user.findUnique({
        where: { id: trx.user_id },
        select: { plan: true, planExpiry: true },
      });

      const now = new Date();
      // Perpanjang dari tanggal berakhir jika paket yang sama masih aktif
      const base =
        user?.plan === trx.plan && user.planExpiry && user.planExpiry > now
          ? user.planExpiry
          : now;

      await tx.user.update({
        where: { id: trx.user_id },
        data: { plan: trx.plan, planExpiry: new Date(base.getTime() + PLAN_DAYS * DAY_MS) },
      });
    });
  } else if (next === "FAILED") {
    await prisma.transaction.updateMany({
      where: { order_id: orderId, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  return next;
}