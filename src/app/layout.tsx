import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MineGate - Monitoring Keluar Masuk Kendaraan Tambang",
  description:
    "Portal Kontrol Gerbang & Manajemen Logistik Armada Tambang Terpadu. Otorisasi instan, inspeksi muatan batubara, dan pelacakan K3.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
