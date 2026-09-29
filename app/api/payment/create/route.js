import midtransClient from "midtrans-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { PLANS } from "@/app/lib/plan";

const snap = new midtransClient.Snap({
  // Set MIDTRANS_IS_PRODUCTION=true di Hostinger hanya jika memakai server key production
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export async function POST(req) {
  try {
    // Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Body: hanya key paket yang dipercaya dari client
    const body = await req.json().catch(() => ({}));
    const planKey = body?.plan?.key;

    // Harga selalu dari server
    const plan = PLANS[planKey];
    if (!plan || plan.price <= 0) {
      return Response.json({ error: "Plan tidak valid" }, { status: 400 });
    }

    const orderId = `LB-${Date.now()}-${session.user.id.slice(-8)}`;

    // Simpan dulu sebagai PENDING supaya pembayaran selalu bisa dicocokkan
    await prisma.transaction.create({
      data: {
        id: orderId,
        order_id: orderId,
        user_id: session.user.id,
        plan: planKey,
        amount: plan.price,
        status: "PENDING",
      },
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: plan.price,
      },
      customer_details: {
        first_name: session.user.name || "User",
        email: session.user.email,
      },
      item_details: [
        {
          id: planKey,
          price: plan.price,
          quantity: 1,
          name: `Upgrade ke Plan ${plan.label}`,
        },
      ],
    };

    try {
      const transaction = await snap.createTransaction(parameter);
      return Response.json({
        order_id: orderId,
        token: transaction.token,
        redirect_url: transaction.redirect_url,
      });
    } catch (err) {
      // Midtrans gagal: tandai transaksi supaya tidak menggantung sebagai PENDING
      await prisma.transaction
        .update({ where: { order_id: orderId }, data: { status: "FAILED" } })
        .catch(() => {});
      throw err;
    }
  } catch (err) {
    console.error("Midtrans Error:", err?.ApiResponse ?? err?.message ?? err);
    return Response.json({ error: "Gagal membuat transaksi" }, { status: 500 });
  }
}