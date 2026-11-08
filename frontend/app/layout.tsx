import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MagnificDownloader Pro — Instant Clean Asset & Stock Downloader",
  description: "The fastest Magnific, Freepik, Motion Array and Envato asset downloader. Download original watermark-free files with 16-connection parallel streaming.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
