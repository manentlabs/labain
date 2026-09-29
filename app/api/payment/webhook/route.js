import crypto from "crypto";
import { syncTransaction } from "@/app/lib/payment";

export async function POST(req) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    console.error("MIDTRANS_SERVER_KEY belum diset");
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { order_id, status_code, gross_amount, signature_key } = body ?? {};
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Verifikasi signature (gross_amount dipakai persis sebagai string dari Midtrans)
  const expected = crypto
    .createHash("sha512")
    .update(order_id + status_code + gross_amount + serverKey)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature_key));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.warn("Invalid signature untuk", order_id);
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  try {
    const result = await syncTransaction(order_id, body);

    // Order tidak ada di database (mis. tombol "Test notification" di dashboard Midtrans)
    if (result === null) {
      console.warn("Webhook untuk order yang tidak dikenal:", order_id);
    } else {
      console.log(`Webhook ${order_id}: ${body.transaction_status} -> ${result}`);
    }

    return Response.json({ status: "ok" });
  } catch (error) {
    // 500 supaya Midtrans mengirim ulang notifikasi
    console.error("Webhook error:", error?.message ?? error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}