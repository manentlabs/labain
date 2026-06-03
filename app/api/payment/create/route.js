import midtransClient from "midtrans-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";

const snap = new midtransClient.Snap({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export async function POST(req) {
  try {
    // 🔐 AUTH CHECK
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 📦 PARSE BODY
    const { plan } = await req.json();

    // ❌ VALIDASI PLAN
    if (!plan || !plan.key || !plan.price) {
      return Response.json(
        { error: "Plan tidak valid" },
        { status: 400 }
      );
    }

    // 🧾 ORDER ID UNIQUE
    const orderId = `ORDER-${Date.now()}-${session.user.id}`;

    // 🛑 CEK DUPLIKAT ORDER
    const existing = await prisma.transaction.findUnique({
      where: { order_id: orderId },
    });

    if (existing) {
      return Response.json(
        { error: "Duplicate order" },
        { status: 409 }
      );
    }

    // 💳 MIDTRANS PARAMETER
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
          id: plan.key,
          price: plan.price,
          quantity: 1,
          name: `Upgrade ke Plan ${plan.label}`,
        },
      ],
    };

    // 🚀 CREATE TRANSACTION MIDTRANS
    const transaction = await snap.createTransaction(parameter);

    // 💾 SIMPAN KE DATABASE
    await prisma.transaction.create({
      data: {
        id: orderId,
        order_id: orderId,
        user_id: session.user.id,
        plan: plan.key || "FREE",
        amount: plan.price,
        status: "PENDING",
      },
    });

    // 📤 RESPONSE KE FRONTEND
    return Response.json({
      order_id: orderId,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });

  } catch (err) {
    console.error("Midtrans Error:", err);

    return Response.json(
      { error: "Gagal membuat transaksi" },
      { status: 500 }
    );
  }
}