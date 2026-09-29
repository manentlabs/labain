import midtransClient from "midtrans-client";

// Satu sumber mode untuk create, status, dan webhook
export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});