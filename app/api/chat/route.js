import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { reserveUsage, refundUsage } from "@/app/lib/usage";
import { prisma } from "@/app/lib/prisma";
import { resolveUserId } from "@/app/lib/getUserId";
import OpenAI, { toFile } from "openai";

export const maxDuration = 60; // pembuatan gambar bisa memakan 20-40 detik

/* ---------------------------------------------------------
   KONFIGURASI
   - MAX_HISTORY     : jumlah pesan terakhir dari database yang dikirim ke model.
   - MAX_LENGTH      : samakan dengan MAX_LENGTH di HomeChat.tsx.
   - MAX_IMAGE_CHARS : batas ukuran foto lampiran (base64, sekitar 4,5 MB).
   - MAX_TOOL_CALLS  : jumlah tool yang dijalankan per pesan.
   - MAX_ENTRIES     : jumlah catatan keuangan per pemanggilan record_finance.
   - MAX_AMOUNT      : batas nilai Int di MySQL (sekitar 2,1 miliar).
   - LOGO_QUALITY    : kualitas gambar logo ("medium" atau "high"). High lebih detail tapi lebih mahal.
   - PHOTO_QUALITY   : kualitas foto produk.
---------------------------------------------------------- */
const MAX_HISTORY = 20;
const MAX_LENGTH = 1000;
const MAX_IMAGE_CHARS = 6_000_000;
const MAX_TOOL_CALLS = 4;
const MAX_ENTRIES = 20;
const MAX_AMOUNT = 2_000_000_000;
const LOGO_QUALITY = "high";
const PHOTO_QUALITY = "medium";
const DEFAULT_PHOTO_PROMPT = "Buatkan foto produk yang menarik dari foto ini.";

const SYSTEM_PROMPT = `Kamu adalah Labain, asisten AI untuk pelaku UMKM Indonesia. Semua kebutuhan pengguna dikerjakan langsung di percakapan ini. Jangan pernah menyuruh pengguna pindah halaman atau membuka fitur lain.

Yang bisa kamu kerjakan:
1. Caption dan promosi: caption media sosial (Instagram, TikTok, Facebook, Shopee), deskripsi produk, ide promosi, profil usaha. Tulis langsung captionnya, tanpa label atau komentar tambahan.
2. Keuangan: mencatat penjualan dan biaya ke pembukuan pengguna, dan menghitung laba.
3. Harga: HPP, margin, harga jual, titik impas.
4. Logo: panggil tool create_logo untuk membuat gambar logo.
5. Foto produk: panggil tool create_product_photo untuk membuat foto produk baru dari foto yang dilampirkan pengguna.
6. Profil usaha: simpan dengan save_business_profile.

Aturan umum:
- Jawab dalam bahasa Indonesia yang santai tapi sopan. Singkat dan praktis, tanpa basa-basi.
- Untuk hitungan, tampilkan langkahnya singkat lalu hasil akhir dalam Rupiah (contoh: Rp15.000).
- Kalau data kurang, tanyakan satu hal yang paling penting, atau beri asumsi yang jelas.
- Jangan mengarang data, aturan pajak, atau regulasi. Kalau tidak yakin, katakan tidak yakin.

Aturan keuangan:
- Saat pengguna menceritakan penjualan atau biaya, panggil record_finance. Satu pemanggilan boleh berisi banyak catatan (misalnya penjualan dan beberapa biaya sekaligus).
- amount adalah TOTAL dalam Rupiah. Kalau pengguna menyebut jumlah dan harga satuan (40 bungkus @Rp15.000), hitung amount = 600000 dan isi juga quantity dan unit_price.
- Tanggal kosong berarti hari ini. Untuk "kemarin" atau tanggal lain, hitung dari tanggal hari ini yang diberikan di bawah.
- Kalau angkanya tidak jelas, tanyakan dulu, jangan menebak. Jangan mencatat ulang hal yang sudah kamu catat di pesan sebelumnya.
- Untuk pertanyaan laba atau ringkasan, panggil get_profit. Jangan menebak angka dari ingatan percakapan.
- Setelah mencatat, ringkas apa yang tersimpan dalam satu-dua kalimat. Kalau pengguna baru menceritakan penjualan dan biaya sekaligus, tampilkan juga laba hari itu dari get_profit.

Aturan profil usaha:
- Kalau pengguna menyebut data usahanya (nama, jenis, produk, target pembeli, lokasi, tempat jualan, gaya bahasa), simpan dengan save_business_profile. Isi hanya bagian yang disebut.
- Pakai profil yang tersimpan sebagai konteks supaya caption dan hitungan sesuai usahanya, tanpa menanyakan ulang hal yang sudah ada.

Aturan logo:
- Syarat membuat: nama usaha dan jenis usaha sudah jelas (dari pesan atau profil usaha). Kalau belum, tanyakan itu saja. Kalau sudah, langsung buat. Jangan menanyakan gaya atau warna, pilih sendiri yang paling cocok kecuali pengguna sudah menyebutkannya.
- Susun konsep dulu sebelum menulis prompt_image:
  a. SIMBOL: satu objek utama yang paling mewakili produk atau inti usaha (misal keripik pisang -> daun pisang dan pisang yang disederhanakan). Jangan menggabungkan banyak objek. Boleh memadukan dua unsur kalau menyatu jadi satu bentuk (misal huruf awal yang membentuk simbol).
  b. GAYA: pilih satu sesuai usaha dan target pembeli. Kuliner rumahan: hangat dan ramah (bentuk membulat, maskot sederhana). Fashion atau kecantikan: elegan dan minimalis (garis tipis, monogram). Jasa atau teknologi: modern dan tegas (geometris). Produk tradisional atau kerajinan: motif nusantara yang disederhanakan (batik, wayang, ukiran). Anak dan kreatif: ceria dan playful.
  c. WARNA: maksimal 2 warna solid, satu dominan. Sebut nama warna spesifik (misal deep navy blue, warm orange, forest green), bukan hanya "biru". Makanan: hangat (oranye, merah, kuning, cokelat). Kesehatan dan alami: hijau. Terpercaya dan profesional: biru atau navy. Mewah: hitam, emas, atau maroon.
  d. TEKS: secara default logo TANPA teks, karena gambar AI sering salah eja. Kalau pengguna minta nama usaha ada di logo, tulis persis di prompt_image dalam tanda kutip, maksimal 3 kata, lalu minta pengguna memeriksa ejaannya.
- prompt_image harus dalam bahasa Inggris, maksimal 250 karakter, dengan pola:
  "Flat vector logo of [satu simbol], [gaya], [warna spesifik], [teks: 'NAMA' atau no text]"
  Contoh: "Flat vector logo of a simplified banana leaf wrapped around a banana chip, warm friendly rounded style, golden yellow and forest green, no text"
- Jangan sebut nama brand terkenal atau nama orang. Jangan pakai kata realistic, photo, 3D, shadow, gradient.
- Kalau pengguna meminta revisi (warna, bentuk, gaya), ubah hanya bagian yang diminta dan pertahankan konsep lainnya.
- Setelah gambar jadi, jelaskan dalam 3-4 kalimat: (1) arti simbol, (2) alasan warna, (3) rekomendasi jenis huruf yang cocok untuk menulis nama usaha di samping logo, (4) tawarkan satu variasi (warna lain atau gaya lain).

Aturan foto produk:
- Tool ini hanya bisa dipakai kalau pengguna sudah melampirkan foto di pesan ini (kamu bisa melihatnya). Kalau belum ada foto, minta pengguna melampirkannya dengan tombol lampiran di kotak chat.
- Kalau pengguna tidak menyebut gaya, pilih yang paling cocok untuk produknya (bersih berlatar putih, lifestyle, gelap premium, flat lay, atau luar ruangan).
- prompt_image harus dalam bahasa Inggris, dimulai dengan "Professional product photography of", menjelaskan produk sedetail mungkin (bentuk, warna eksak, bahan, label dan tulisan yang terlihat) sebelum menjelaskan latar, pencahayaan, dan suasana. Produk harus terlihat identik dengan aslinya.
- Setelah gambar jadi, jelaskan singkat gaya yang dipilih.

Kalau sebuah tool gagal, sampaikan terus terang dan tawarkan untuk mencoba lagi. Kalau tool gagal karena fitur tidak tersedia di paket pengguna atau limit harian habis, sampaikan dengan ramah dan sarankan upgrade paket lewat menu Akun.`;

const tools = [
  {
    type: "function",
    function: {
      name: "create_logo",
      description: "Membuat satu gambar logo untuk usaha pengguna. Panggil hanya setelah nama dan jenis usaha jelas.",
      parameters: {
        type: "object",
        properties: {
          prompt_image: {
            type: "string",
            description:
              "Bahasa Inggris, maks 250 karakter. Pola: 'Flat vector logo of [satu simbol utama], [gaya], [1-2 warna spesifik], [no text atau teks persis dalam tanda kutip]'.",
          },
        },
        required: ["prompt_image"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_product_photo",
      description: "Membuat foto produk baru dari foto yang dilampirkan pengguna di pesan ini.",
      parameters: {
        type: "object",
        properties: {
          prompt_image: {
            type: "string",
            description: "Prompt gambar berbahasa Inggris, dimulai dengan 'Professional product photography of'.",
          },
        },
        required: ["prompt_image"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_finance",
      description: "Menyimpan catatan penjualan (INCOME) atau biaya (EXPENSE) ke pembukuan pengguna.",
      parameters: {
        type: "object",
        properties: {
          entries: {
            type: "array",
            description: "Daftar catatan yang akan disimpan.",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["INCOME", "EXPENSE"] },
                description: { type: "string", description: "Misal 'Penjualan keripik pisang' atau 'Belanja bahan'." },
                amount: { type: "integer", description: "Total dalam Rupiah, bilangan bulat." },
                category: { type: "string", description: "Misal Penjualan, Bahan baku, Gaji, Ongkir." },
                quantity: { type: "integer", description: "Jumlah barang, bila disebut." },
                unit_price: { type: "integer", description: "Harga satuan dalam Rupiah, bila disebut." },
                date: { type: "string", description: "Format YYYY-MM-DD. Kosongkan untuk hari ini." },
              },
              required: ["type", "description", "amount"],
            },
          },
        },
        required: ["entries"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_profit",
      description: "Menghitung total pemasukan, pengeluaran, dan laba dari pembukuan pengguna pada rentang tanggal.",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "YYYY-MM-DD. Kosong berarti hari ini." },
          end_date: { type: "string", description: "YYYY-MM-DD. Kosong berarti hari ini." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_business_profile",
      description: "Menyimpan atau memperbarui profil usaha pengguna. Isi hanya bagian yang disebut pengguna.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nama usaha." },
          category: { type: "string", description: "Jenis usaha, misal makanan ringan." },
          description: { type: "string", description: "Cerita atau filosofi usaha." },
          products: { type: "string", description: "Produk utama." },
          target_customer: { type: "string", description: "Target pembeli." },
          location: { type: "string", description: "Kota atau daerah." },
          channels: { type: "string", description: "Tempat jualan, misal Instagram, Shopee." },
          tone: { type: "string", description: "Gaya bahasa promosi yang disukai." },
        },
      },
    },
  },
];

/* ---------------- Helper umum ---------------- */

function clip(v, n) {
  return typeof v === "string" ? v.trim().slice(0, n) : "";
}

function posInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= MAX_AMOUNT ? n : null;
}

// Tanggal hari ini di WIB, format YYYY-MM-DD.
function todayWIB() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
}

function isValidDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const toDate = (s) => new Date(`${s}T00:00:00.000Z`);
const rupiah = (n) => `Rp${Number(n).toLocaleString("id-ID")}`;

function buildSystemPrompt(business, today) {
  let prompt = `${SYSTEM_PROMPT}\n\nTanggal hari ini: ${today} (WIB).`;

  if (business) {
    const lines = [
      business.name && `- Nama usaha: ${business.name}`,
      business.category && `- Jenis usaha: ${business.category}`,
      business.description && `- Cerita usaha: ${business.description}`,
      business.products && `- Produk utama: ${business.products}`,
      business.targetCustomer && `- Target pembeli: ${business.targetCustomer}`,
      business.location && `- Lokasi: ${business.location}`,
      business.channels && `- Tempat jualan: ${business.channels}`,
      business.tone && `- Gaya bahasa promosi: ${business.tone}`,
    ].filter(Boolean);
    prompt += `\n\nProfil usaha pengguna yang tersimpan:\n${lines.join("\n")}`;
  } else {
    prompt += "\n\nPengguna belum punya profil usaha tersimpan.";
  }
  return prompt;
}

/* ---------------- Gambar ---------------- */

// Simpan hasil gambar (base64) ke tabel Image, kembalikan URL-nya.
// Gambar disajikan oleh app/api/images/[file]/route.js
async function saveImage(b64, userId) {
  if (!b64) throw new Error("Tidak ada data gambar");
  const img = await prisma.image.create({
    data: { userId, data: Buffer.from(b64, "base64") },
    select: { id: true },
  });
  return `/api/images/${img.id}`;
}

// Buat gambar dari teks saja (dipakai untuk logo).
async function generateImage(openai, prompt, userId, quality = "medium") {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: prompt.slice(0, 1200).trimEnd(),
    size: "1024x1024",
    quality,
    n: 1,
  });
  return saveImage(result.data?.[0]?.b64_json, userId);
}

// Ubah foto lampiran menjadi foto produk baru. Foto asli ikut dikirim ke model gambar,
// jadi bentuk, warna, dan label produk tetap setia ke aslinya.
async function editImage(openai, prompt, userId, dataUrl, quality = "medium") {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(dataUrl || "");
  if (!m) {
    throw Object.assign(new Error("Format foto tidak didukung"), { unsupportedFormat: true });
  }
  const mime = m[1];
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  const file = await toFile(Buffer.from(m[2], "base64"), `product.${ext}`, { type: mime });

  const result = await openai.images.edit({
    model: "gpt-image-1",
    image: file,
    prompt: prompt.slice(0, 1500).trimEnd(),
    size: "1024x1024",
    quality,
    n: 1,
  });
  return saveImage(result.data?.[0]?.b64_json, userId);
}

/* ---------------- Tool ---------------- */

async function runToolInner(ctx, name, args) {
  const { openai, userId, conversationId, image, today } = ctx;

  try {
    switch (name) {
      case "create_logo": {
        const prompt = clip(args.prompt_image, 600);
        if (!prompt) return { result: "Gagal: prompt gambar kosong." };
        const full =
          `${prompt}. Clean flat vector logo design, solid colors only, bold simple shapes with a clear silhouette, ` +
          "balanced composition centered on a square canvas with generous empty margin, " +
          "still readable at small sizes like a profile picture, " +
          "isolated on a plain pure white background, no gradients, no shadows, no 3D effects, professional brand identity";
        const url = await generateImage(openai, full, userId, LOGO_QUALITY);
        return {
          result: "Berhasil. Logo sudah dibuat dan ditampilkan ke pengguna.",
          image: { url, label: "Logo" },
        };
      }

      case "create_product_photo": {
        const prompt = clip(args.prompt_image, 800);
        if (!prompt) return { result: "Gagal: prompt gambar kosong." };
        if (!image) {
          return {
            result:
              "Gagal: pengguna belum melampirkan foto produk di pesan ini. Minta pengguna melampirkan foto lewat tombol lampiran di kotak chat.",
          };
        }
        const full =
          `${prompt}. Keep the product from the input photo exactly the same: identical shape, exact colors, ` +
          "materials, label design and any printed text. Change only the background, lighting and setting. " +
          "Ultra sharp, product in perfect focus, photorealistic, no extra text overlays, no watermarks, " +
          "shot on professional camera, commercial advertising quality";
        const url = await editImage(openai, full, userId, image, PHOTO_QUALITY);
        return {
          result: "Berhasil. Foto produk sudah dibuat dan ditampilkan ke pengguna.",
          image: { url, label: "Foto produk" },
        };
      }

      case "record_finance": {
        const list = Array.isArray(args.entries) ? args.entries.slice(0, MAX_ENTRIES) : [];
        const rows = [];
        const errors = [];

        list.forEach((e, i) => {
          const type = e?.type === "INCOME" || e?.type === "EXPENSE" ? e.type : null;
          const amount = posInt(e?.amount);
          const description = clip(e?.description, 191);
          if (!type || !amount || !description) {
            errors.push(`Catatan ke-${i + 1} tidak valid dan dilewati.`);
            return;
          }
          const date = isValidDate(e?.date) ? e.date : today;
          rows.push({
            userId,
            conversationId,
            type,
            amount,
            description,
            category: clip(e?.category, 191) || null,
            quantity: posInt(e?.quantity),
            unitPrice: posInt(e?.unit_price),
            entryDate: toDate(date),
            _date: date,
          });
        });

        if (rows.length === 0) {
          return { result: `Gagal: tidak ada catatan yang valid. ${errors.join(" ")}`.trim() };
        }

        await prisma.financeEntry.createMany({
          data: rows.map(({ _date, ...row }) => row),
        });

        const summary = rows
          .map(
            (r) =>
              `- ${r.type === "INCOME" ? "Pemasukan" : "Pengeluaran"} ${rupiah(r.amount)}: ${r.description} (${r._date})`
          )
          .join("\n");
        return {
          result: `Berhasil menyimpan ${rows.length} catatan:\n${summary}${errors.length ? `\n${errors.join(" ")}` : ""}`,
        };
      }

      case "get_profit": {
        let start = isValidDate(args.start_date) ? args.start_date : today;
        let end = isValidDate(args.end_date) ? args.end_date : today;
        if (start > end) [start, end] = [end, start];

        const groups = await prisma.financeEntry.groupBy({
          by: ["type"],
          where: { userId, entryDate: { gte: toDate(start), lte: toDate(end) } },
          _sum: { amount: true },
          _count: { _all: true },
        });

        const income = groups.find((g) => g.type === "INCOME");
        const expense = groups.find((g) => g.type === "EXPENSE");
        const totalIncome = income?._sum.amount ?? 0;
        const totalExpense = expense?._sum.amount ?? 0;
        const count = (income?._count._all ?? 0) + (expense?._count._all ?? 0);

        if (count === 0) {
          return { result: `Belum ada catatan keuangan pada ${start} sampai ${end}.` };
        }
        return {
          result:
            `Periode ${start} sampai ${end} (${count} catatan):\n` +
            `- Pemasukan: ${rupiah(totalIncome)}\n` +
            `- Pengeluaran: ${rupiah(totalExpense)}\n` +
            `- Laba: ${rupiah(totalIncome - totalExpense)}`,
        };
      }

      case "save_business_profile": {
        const fields = {
          name: clip(args.name, 191),
          category: clip(args.category, 191),
          description: clip(args.description, 2000),
          products: clip(args.products, 2000),
          targetCustomer: clip(args.target_customer, 191),
          location: clip(args.location, 191),
          channels: clip(args.channels, 191),
          tone: clip(args.tone, 191),
        };
        const data = Object.fromEntries(Object.entries(fields).filter(([, v]) => v));
        if (Object.keys(data).length === 0) {
          return { result: "Gagal: tidak ada data profil yang bisa disimpan." };
        }

        const existing = await prisma.business.findUnique({ where: { userId }, select: { id: true } });
        if (!existing && !data.name) {
          return { result: "Gagal: nama usaha wajib ada untuk pertama kali. Tanyakan nama usahanya." };
        }

        await prisma.business.upsert({
          where: { userId },
          update: data,
          create: { userId, ...data },
        });
        return { result: `Berhasil menyimpan profil usaha (${Object.keys(data).join(", ")}).` };
      }

      default:
        return { result: "Gagal: tool tidak dikenal." };
    }
  } catch (err) {
    console.error(`Tool ${name} error:`, err?.message);
    if (err?.unsupportedFormat) {
      return {
        result: "Gagal: format foto tidak didukung. Minta pengguna melampirkan foto berformat JPG, PNG, atau WebP.",
      };
    }
    const msg = String(err?.message ?? "");
    if (msg.includes("content_policy") || msg.includes("safety") || msg.includes("rejected")) {
      return {
        result: "Gagal: permintaan ditolak oleh kebijakan konten. Coba dengan deskripsi yang lebih sederhana.",
      };
    }
    if (name === "create_logo" || name === "create_product_photo") {
      return { result: "Gagal: gambar tidak bisa dibuat saat ini. Tawarkan untuk mencoba lagi." };
    }
    return { result: "Gagal: data tidak bisa disimpan atau dibaca saat ini. Tawarkan untuk mencoba lagi." };
  }
}

// Tool mana memakai kuota fitur mana. Tool yang tidak terdaftar (get_profit) tidak dibatasi.
const TOOL_FEATURE = {
  create_logo: "logo",
  create_product_photo: "photo",
  record_finance: "finance",
  save_business_profile: "profile",
};

// Pesan jatah dulu, jalankan tool, kembalikan jatah kalau gagal (hasil diawali "Gagal").
async function runTool(ctx, name, args) {
  const feature = TOOL_FEATURE[name];
  if (!feature) return runToolInner(ctx, name, args);

  const r = await reserveUsage(ctx.userId, feature);
  if (!r.allowed) {
    return { result: `Gagal: ${r.reason} Sampaikan ini ke pengguna dengan ramah.` };
  }

  let out;
  try {
    out = await runToolInner(ctx, name, args);
  } catch (err) {
    await refundUsage(ctx.userId, feature).catch(() => {});
    throw err;
  }

  if (String(out.result).startsWith("Gagal")) {
    await refundUsage(ctx.userId, feature).catch(() => {});
  }
  return out;
}

/* ---------------- Handler ---------------- */

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const userId = await resolveUserId(session);
  if (!userId) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const message = clip(body?.message, MAX_LENGTH);
  if (!message) {
    return Response.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
  }

  // Foto lampiran (opsional) hanya berlaku untuk pesan ini.
  const rawImage = typeof body?.image === "string" ? body.image : "";
  const image =
    rawImage.startsWith("data:image/") && rawImage.length <= MAX_IMAGE_CHARS ? rawImage : null;
  if (rawImage && !image) {
    return Response.json({ error: "Foto tidak valid atau terlalu besar." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY tidak ditemukan" }, { status: 500 });
  }

  // Percakapan lama harus milik pengguna ini.
  let conversationId = null;
  if (typeof body?.conversationId === "string" && body.conversationId) {
    const found = await prisma.conversation.findFirst({
      where: { id: body.conversationId, userId },
      select: { id: true },
    });
    if (!found) {
      return Response.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });
    }
    conversationId = found.id;
  }

  // Percakapan baru dibuat di awal (dibutuhkan untuk menautkan catatan keuangan),
  // lalu dihapus lagi kalau permintaan gagal.
  let createdNew = false;
  let title = "";
  if (!conversationId) {
    title = (message === DEFAULT_PHOTO_PROMPT ? "Foto produk" : message).slice(0, 60);
    const created = await prisma.conversation.create({ data: { userId, title }, select: { id: true } });
    conversationId = created.id;
    createdNew = true;
  }

  try {
    const [business, past] = await Promise.all([
      prisma.business.findUnique({ where: { userId } }),
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: MAX_HISTORY,
        select: { role: true, content: true },
      }),
    ]);

    const today = todayWIB();
    const history = past.reverse().map((m) => ({ role: m.role, content: m.content }));

    const userContent = image
      ? [
          { type: "text", text: message },
          { type: "image_url", image_url: { url: image, detail: "high" } },
        ]
      : message;

    const convo = [
      { role: "system", content: buildSystemPrompt(business, today) },
      ...history,
      { role: "user", content: userContent },
    ];

    // Dibuat di sini (bukan di level file) supaya build tidak butuh key.
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = image ? "gpt-4o" : "gpt-4o-mini"; // gpt-4o lebih teliti membaca foto

    const first = await openai.chat.completions.create({
      model,
      messages: convo,
      tools,
      temperature: 0.7,
      max_tokens: 800,
    });

    const msg = first.choices?.[0]?.message;
    const images = [];
    let reply = msg?.content?.trim() ?? "";

    if (msg?.tool_calls?.length) {
      convo.push(msg);
      const ctx = { openai, userId, conversationId, image, today };

      // Dijalankan berurutan, jadi get_profit selalu melihat hasil record_finance sebelumnya.
      for (const [i, call] of msg.tool_calls.entries()) {
        // Setiap tool_call wajib dijawab, termasuk yang dilewati.
        if (i >= MAX_TOOL_CALLS) {
          convo.push({ role: "tool", tool_call_id: call.id, content: "Dilewati: terlalu banyak permintaan sekaligus." });
          continue;
        }

        let args = {};
        try {
          args = JSON.parse(call.function.arguments);
        } catch {}

        const out = await runTool(ctx, call.function.name, args);
        if (out.image) images.push(out.image);
        convo.push({ role: "tool", tool_call_id: call.id, content: out.result });
      }

      const final = await openai.chat.completions.create({
        model,
        messages: convo,
        tools,
        tool_choice: "none",
        temperature: 0.7,
        max_tokens: 800,
      });
      reply = final.choices?.[0]?.message?.content?.trim() ?? "";
    }

    if (!reply && images.length) reply = "Ini hasilnya.";
    if (!reply) {
      throw Object.assign(new Error("Balasan kosong"), {
        userMessage: "Labain belum bisa menjawab. Coba tulis ulang pertanyaanmu.",
        status: 502,
      });
    }

    // Simpan pasangan pesan hanya kalau seluruh proses berhasil.
    const now = Date.now();
    await prisma.$transaction([
      prisma.message.create({
        data: { conversationId, role: "user", content: message, hasAttachment: Boolean(image), createdAt: new Date(now) },
      }),
      prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: reply,
          images: images.length ? images : undefined,
          createdAt: new Date(now + 1),
        },
      }),
      prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    ]);

    return Response.json({ reply, images, conversationId, title: title || undefined });
  } catch (error) {
    console.error("Chat API error:", error);

    if (createdNew) {
      await prisma.conversation.deleteMany({ where: { id: conversationId, userId } }).catch(() => {});
    }

    if (error?.userMessage) {
      return Response.json({ error: error.userMessage }, { status: error.status ?? 500 });
    }
    if (error?.status === 429) {
      return Response.json({ error: "Labain sedang ramai. Coba lagi sebentar lagi." }, { status: 429 });
    }
    return Response.json({ error: "Terjadi kesalahan pada asisten. Coba lagi." }, { status: 500 });
  }
}