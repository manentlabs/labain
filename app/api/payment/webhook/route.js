import crypto from "crypto";
import { prisma } from "@/app/lib/prisma";

export async function POST(req) {
  try {
    // 1. Ambil body dalam bentuk teks untuk logging/debug
    const rawBody = await req.text();
    let body;

    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      console.error("❌ JSON parse error:", err);
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    // 2. Validasi field wajib dari Midtrans
    if (!body.order_id || !body.status_code || !body.gross_amount || !body.signature_key) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    // 3. Verifikasi Signature Key (Keamanan Server-to-Server)
    const expectedSignature = crypto
      .createHash("sha512")
      .update(
        body.order_id +
        body.status_code +
        body.gross_amount +
        serverKey
      )
      .digest("hex");

    if (expectedSignature !== body.signature_key) {
      console.warn("⚠️ Invalid Signature detected!");
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }

    const orderId = body.order_id;
    const transactionStatus = body.transaction_status;

    console.log(`🔔 Webhook received for ${orderId}: ${transactionStatus}`);

    try {
      // 4. Update status di tabel transaction
      // Menggunakan update karena data sudah dibuat di api/payment/create
      const updatedTrx = await prisma.transaction.update({
        where: { order_id: orderId },
        data: { 
          status: transactionStatus.toUpperCase() 
        },
      });

      // 5. Logika Upgrade User jika pembayaran sukses
      const isSuccess = transactionStatus === "settlement" || transactionStatus === "capture";
      
      if (isSuccess) {
        // Ambil data user untuk memastikan tidak double upgrade jika webhook terkirim 2x
        const user = await prisma.user.findUnique({
          where: { id: updatedTrx.user_id }
        });

        // Hanya update jika plan belum berubah atau masa berlaku sudah lewat (menghindari tumpang tindih)
        await prisma.user.update({
          where: { id: updatedTrx.user_id },
          data: {
            plan: updatedTrx.plan, // Dinamis: STARTER atau PRO
            planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Tambah 30 hari
          },
        });

        console.log(`✅ User ${updatedTrx.user_id} successfully upgraded to ${updatedTrx.plan}`);
      }

    } catch (err) {
      console.error("❌ Database Error:", err.message);
      // Tetap return OK agar Midtrans tidak mengirim ulang notifikasi terus-menerus
    }

    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("🔥 Webhook Fatal Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}