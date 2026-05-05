import nodemailer from "nodemailer";

export async function sendVerificationEmail(email, link) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // pakai App Password Gmail
    },
  });

  await transporter.sendMail({
    from: `"LabAIn" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verifikasi Email Akun Kamu",
    html: `
      <div style="font-family:Arial;padding:10px">
        <h2>Verifikasi Akun LabAIn</h2>
        <p>Klik tombol di bawah untuk verifikasi:</p>
        <a href="${link}" style="padding:10px 15px;background:#059669;color:white;text-decoration:none;border-radius:6px;">
          Verifikasi Email
        </a>
        <p style="margin-top:10px;font-size:12px;color:#888">
          Jika kamu tidak merasa mendaftar, abaikan email ini.
        </p>
      </div>
    `,
  });
}