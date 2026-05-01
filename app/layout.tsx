import "./globals.css";
import Providers from "./providers";
import Navbar from "./components/Navbar";
import Script from "next/script"; 

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          {children}
		  <Script src="https://app.sandbox.midtrans.com/snap/snap.js" 
			data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} />
        </Providers>
      </body>
    </html>
  );
}

export const metadata = {
  title: "LabAIn - AI untuk UMKM Indonesia",
  description:
    "Platform AI untuk UMKM: buat caption, profil usaha, dan konten bisnis otomatis dengan AI.",
  keywords: [
    "AI UMKM",
    "AI bisnis Indonesia",
    "caption generator",
    "usaha AI",
    "AI marketing UMKM",
  ],
  metadataBase: new URL("https://labain.digital"),
  openGraph: {
    title: "LabaAIn - AI UMKM Platform",
    description: "Bantu UMKM Indonesia berkembang dengan AI",
    url: "https://labain.digital",
    siteName: "LabAIn",
    type: "website",
  },
};
