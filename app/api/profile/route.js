import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = withUsageCheck("profile", async (req, session) => {
  const { namaUsaha, jenis, deskripsi, lokasi, tahunBerdiri, keunggulanUtama } =
    await req.json();

  if (!namaUsaha?.trim())
    return Response.json({ error: "Nama usaha wajib diisi" }, { status: 400 });
  if (!jenis?.trim())
    return Response.json({ error: "Jenis usaha wajib diisi" }, { status: 400 });
  if (!deskripsi?.trim())
    return Response.json({ error: "Deskripsi usaha wajib diisi" }, { status: 400 });
  if (!process.env.OPENAI_API_KEY)
    return Response.json({ error: "OPENAI_API_KEY tidak ditemukan" }, { status: 500 });

  const extraContext = [
    lokasi ? `Lokasi: ${lokasi}` : null,
    tahunBerdiri ? `Tahun berdiri: ${tahunBerdiri}` : null,
    keunggulanUtama ? `Keunggulan yang ingin ditonjolkan: ${keunggulanUtama}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Kamu sedang membuat profil usaha profesional untuk UMKM berikut:

## Data Usaha
Nama Usaha: ${namaUsaha}
Jenis Usaha: ${jenis}
Deskripsi dari pemilik: ${deskripsi}
${extraContext}

## Instruksi Penulisan
Setiap bagian HARUS:
- Menyebut nama usaha (${namaUsaha}) atau jenis usaha secara eksplisit — jangan generik
- Ditulis seolah diceritakan langsung oleh brand yang bersangkutan
- Menghindari frasa klise kosong seperti "berkualitas tinggi", "terpercaya", "terbaik" tanpa konteks konkret
- Menggunakan bahasa Indonesia yang hangat, profesional, dan mudah dipahami masyarakat umum

## Format Output
Balas HANYA dengan JSON valid. Tanpa markdown, tanpa komentar, tanpa teks di luar JSON.

{
  "tagline": "Kalimat pendek 6–10 kata yang langsung mencerminkan identitas atau janji utama ${namaUsaha}. Buat berkesan dan mudah diingat.",

  "about": "4–5 kalimat yang menceritakan latar belakang ${namaUsaha}: mengapa usaha ini ada, apa yang membuatnya berbeda sejak awal, dan bagaimana perjalanannya hingga kini. Buat terasa nyata dan manusiawi — bukan seperti teks brosur.",

  "keunggulan": [
    "Keunggulan 1: Sebutkan aspek spesifik (proses, bahan, layanan, dll.) yang hanya dimiliki atau difokuskan ${namaUsaha}, lalu jelaskan manfaat nyatanya bagi pelanggan dalam 1–2 kalimat.",
    "Keunggulan 2: ...",
    "Keunggulan 3: ...",
    "Keunggulan 4: ...",
    "Keunggulan 5: ..."
  ],

  "visiMisi": "Mulai dengan VISI: satu kalimat yang menggambarkan dampak jangka panjang yang ingin dicapai ${namaUsaha}. Lanjut dengan MISI: 3 poin konkret (bisa ditulis dalam satu paragraf) tentang cara ${namaUsaha} mewujudkan visi tersebut setiap harinya.",

  "nilaiUsaha": "3–4 kalimat tentang prinsip-prinsip yang benar-benar memandu cara ${namaUsaha} bekerja dan melayani — bukan sekadar nilai abstrak, tapi yang tercermin dalam praktik nyata.",

  "targetPasar": "2–3 kalimat: siapa pelanggan utama ${namaUsaha} (usia, gaya hidup, kebutuhan spesifik), mengapa mereka memilih ${namaUsaha}, dan masalah apa yang diselesaikan untuk mereka.",

  "produkLayanan": "3–4 kalimat yang mendeskripsikan produk atau layanan utama ${namaUsaha} secara menarik — fokus pada manfaat yang dirasakan pelanggan, bukan sekadar daftar fitur.",

  "komitmenKualitas": "2–3 kalimat spesifik tentang langkah nyata yang dilakukan ${namaUsaha} untuk menjaga kualitas: proses seleksi, standar produksi, kontrol kualitas, atau garansi layanan.",

  "callToAction": "Satu kalimat ajakan yang terasa personal dan urgen — sesuai karakter ${namaUsaha}, bukan template generik. Arahkan ke tindakan spesifik: order, kunjungi, hubungi, coba sekarang, dll."
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Kamu adalah konsultan brand dan copywriter senior yang spesialis membangun identitas UMKM Indonesia. " +
          "Kamu tahu bahwa profil usaha yang baik bukan soal kata-kata megah, tapi soal kejujuran, kekhasan, dan relevansi. " +
          "Setiap profil yang kamu tulis harus terasa unik untuk usaha tersebut — pembaca harus langsung tahu ini bukan template. " +
          "Balas selalu dengan JSON valid saja, tanpa format markdown atau teks di luar JSON.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.72,
    max_tokens: 2200,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
  if (!raw)
    return Response.json({ error: "Respons kosong dari OpenAI" }, { status: 500 });

  let profile;
  try {
    profile = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Format respons tidak valid" }, { status: 500 });
  }

  // Validasi field wajib
  const requiredFields = [
    "tagline",
    "about",
    "keunggulan",
    "visiMisi",
    "nilaiUsaha",
    "targetPasar",
    "produkLayanan",
    "komitmenKualitas",
    "callToAction",
  ];

  for (const field of requiredFields) {
    if (!profile[field])
      return Response.json(
        { error: `Field '${field}' tidak ada di respons` },
        { status: 500 }
      );
  }

  // Validasi keunggulan harus array dengan minimal 3 item
  if (!Array.isArray(profile.keunggulan) || profile.keunggulan.length < 3) {
    return Response.json(
      { error: "Field 'keunggulan' harus berupa array dengan minimal 3 item" },
      { status: 500 }
    );
  }

  return Response.json({ profile });
});