"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl p-8">

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900">
          Syarat & Ketentuan
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Terakhir diperbarui: April 2026
        </p>

        <div className="mt-6 space-y-6 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">1. Penggunaan Layanan</h2>
            <p>
              Dengan menggunakan platform ini, Anda setuju untuk menggunakan layanan
              hanya untuk tujuan yang sah dan tidak melanggar hukum yang berlaku di Indonesia.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">2. Akun Pengguna</h2>
            <p>
              Anda bertanggung jawab atas keamanan akun Anda, termasuk email dan password.
              Kami tidak bertanggung jawab atas penyalahgunaan akun akibat kelalaian pengguna.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">3. Penggunaan AI</h2>
            <p>
              Layanan ini menggunakan teknologi Artificial Intelligence untuk menghasilkan
              konten seperti teks, logo, dan gambar. Hasil AI dapat bervariasi dan tidak
              selalu sempurna.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">4. Limit & Pembayaran</h2>
            <p>
              Setiap akun memiliki batas penggunaan (limit). Pengguna dapat melakukan upgrade
              ke paket berbayar untuk mendapatkan akses lebih besar dan fitur tambahan.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">5. Hak Cipta</h2>
            <p>
              Konten yang dihasilkan oleh AI dapat digunakan oleh pengguna untuk keperluan
              bisnis pribadi atau komersial, kecuali dinyatakan lain dalam kebijakan kami.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">6. Pembatasan Tanggung Jawab</h2>
            <p>
              Kami tidak bertanggung jawab atas kerugian langsung maupun tidak langsung
              yang timbul dari penggunaan layanan ini.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-gray-900 mb-1">7. Perubahan Ketentuan</h2>
            <p>
              Kami dapat memperbarui syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya.
              Pengguna disarankan untuk memeriksa halaman ini secara berkala.
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