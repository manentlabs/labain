"use client";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl p-8">

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900">
          Kebijakan Privasi
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Terakhir diperbarui: April 2026
        </p>

        <div className="mt-6 space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi seperti nama, email, data akun, serta input
              yang Anda masukkan ke dalam layanan (contoh: nama usaha, deskripsi, gambar produk).
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">2. Penggunaan Informasi</h2>
            <p>
              Informasi yang dikumpulkan digunakan untuk menyediakan layanan AI seperti
              pembuatan profil usaha, logo, dan foto produk yang dipersonalisasi.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">3. Penyimpanan Data</h2>
            <p>
              Data Anda disimpan secara aman dan hanya digunakan untuk kebutuhan layanan.
              Kami tidak menjual atau membagikan data pribadi kepada pihak ketiga tanpa izin.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">4. Penggunaan AI</h2>
            <p>
              Sistem kami menggunakan model AI pihak ketiga untuk menghasilkan konten.
              Input Anda dapat diproses oleh sistem AI untuk menghasilkan output yang relevan.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">5. Keamanan Data</h2>
            <p>
              Kami menggunakan langkah-langkah teknis dan organisasi untuk melindungi data Anda
              dari akses tidak sah, perubahan, atau pengungkapan.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">6. Cookies & Tracking</h2>
            <p>
              Kami dapat menggunakan cookies untuk meningkatkan pengalaman pengguna,
              analitik, dan performa aplikasi.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">7. Hak Pengguna</h2>
            <p>
              Anda berhak mengakses, memperbarui, atau menghapus data pribadi Anda
              sesuai dengan ketentuan yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">8. Perubahan Kebijakan</h2>
            <p>
              Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan
              diumumkan melalui halaman ini.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
          © {new Date().getFullYear()} UMKM AI. All rights reserved.
        </div>

      </div>
    </div>
  );
}