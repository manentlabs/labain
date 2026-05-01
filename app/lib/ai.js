export function generateCaption({ product, tone = "default", platform = "general" }) {
  let hook = "🔥";
  let style = "";

  // tone handling
  switch (tone) {
    case "formal":
      style = "Segera dapatkan produk terbaik kami dengan penawaran eksklusif.";
      break;
    case "fun":
      style = "Yuk gaskeun! Produk ini bikin hidup kamu makin gampang 😎";
      break;
    case "sales":
      style = "PROMO TERBATAS! Jangan sampai kehabisan!";
      break;
    default:
      style = "Dapatkan kualitas terbaik dengan harga spesial.";
  }

  // platform adjustment
  if (platform === "instagram") hook = "🔥✨";
  if (platform === "tiktok") hook = "🚀";
  if (platform === "whatsapp") hook = "📩";

  return `${hook} ${product} sekarang hadir untuk kamu!
${style}
Order sekarang sebelum kehabisan! 🚀`;
}