import { withUsageCheck } from "@/app/lib/withUsageCheck";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = withUsageCheck("profile", async (req, session) => {
  const { namaUsaha, jenis, deskripsi } = await req.json();

  if (!namaUsaha?.trim())
    return Response.json({ error: "Nama usaha wajib diisi" }, { status: 400 });
  if (!jenis?.trim())
    return Response.json({ error: "Jenis usaha wajib diisi" }, { status: 400 });
  if (!deskripsi?.trim())
    return Response.json({ error: "Deskripsi usaha wajib diisi" }, { status: 400 });
  if (!process.env.OPENAI_API_KEY)
    return Response.json({ error: "OPENAI_API_KEY tidak ditemukan" }, { status: 500 });

  const prompt = `Buat profil usaha profesional dan lengkap untuk UMKM berikut:

Nama Usaha: ${namaUsaha}
Jenis Usaha: ${jenis}
Deskripsi: ${deskripsi}

Balas HANYA dengan JSON valid tanpa markdown, tanpa komentar, tanpa teks tambahan apapun.
Format JSON persis seperti ini:
{
  "tagline": "tagline singkat dan menarik maksimal 10 kata",
  "about": "4-5 kalimat mendalam tentang latar belakang, sejarah singkat, dan identitas usaha ini",
  "keunggulan": [
    "keunggulan pertama — jelaskan secara spesifik dan meyakinkan dalam 1-2 kalimat",
    "keunggulan kedua — jelaskan secara spesifik dan meyakinkan dalam 1-2 kalimat",
    "keunggulan ketiga — jelaskan secara spesifik dan meyakinkan dalam 1-2 kalimat",
    "keunggulan keempat — jelaskan secara spesifik dan meyakinkan dalam 1-2 kalimat",
    "keunggulan kelima — jelaskan secara spesifik dan meyakinkan dalam 1-2 kalimat"
  ],
  "visiMisi": "Tuliskan visi usaha dalam 1-2 kalimat inspiratif, lalu misi dalam 3-4 kalimat konkret yang menjelaskan cara mencapai visi tersebut",
  "nilaiUsaha": "3-4 kalimat tentang nilai-nilai inti yang dipegang teguh oleh usaha ini dalam melayani pelanggan dan menjalankan bisnis",
  "targetPasar": "2-3 kalimat yang menjelaskan siapa target pelanggan utama, karakteristik mereka, dan mengapa produk/layanan ini cocok untuk mereka",
  "produkLayanan": "3-4 kalimat yang mendeskripsikan produk atau layanan unggulan secara menarik, termasuk manfaat utama bagi pelanggan",
  "komitmenKualitas": "2-3 kalimat tentang bagaimana usaha ini menjaga dan memastikan kualitas produk atau layanannya",
  "callToAction": "Satu kalimat ajakan kuat dan persuasif untuk mendorong calon pelanggan segera mencoba atau menghubungi usaha ini"
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Kamu adalah copywriter dan konsultan bisnis profesional untuk UMKM Indonesia. " +
          "Tugasmu membuat profil usaha yang komprehensif, menarik, kredibel, dan bernilai tinggi. " +
          "Gunakan bahasa Indonesia yang profesional namun mudah dipahami. " +
          "Setiap bagian harus terasa autentik dan spesifik terhadap usaha yang diberikan. " +
          "Selalu balas hanya dengan JSON valid tanpa format markdown.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.75,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
  if (!raw)
    return Response.json({ error: "Respons kosong dari OpenAI" }, { status: 500 });

  let profile;
  try {
    profile = JSON.parse(raw);
  } catch (e) {
    return Response.json({ error: "Format respons tidak valid" }, { status: 500 });
  }

  const required = [
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

  for (const field of required) {
    if (!profile[field])
      return Response.json({ error: `Field '${field}' tidak ada di respons` }, { status: 500 });
  }

  return Response.json({ profile });
});