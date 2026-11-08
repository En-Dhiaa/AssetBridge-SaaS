import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssetBridge SaaS - Enterprise Asset Gateway",
  description: "High-speed authorized design & media downloader with 16-connection multi-stream and cryptographic compliance.",
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
