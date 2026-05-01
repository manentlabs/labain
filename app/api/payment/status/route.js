import midtransClient from "midtrans-client";

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return Response.json({ error: "order_id is required" }, { status: 400 });
  }

  try {
    const statusResponse = await snap.transaction.status(orderId);
    return Response.json(statusResponse);
  } catch (error) {
    console.error("Status check error:", error);
    return Response.json(
      { error: error.message },
      { status: error.httpStatusCode || 500 }
    );
  }
}