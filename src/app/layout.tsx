import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { Compass, BookOpen, FileCheck, Anchor, Users, Globe2, FileText } from "lucide-react";
import SessionProvider from "@/components/providers/SessionProvider";
import Navbar from "@/components/navigation/Navbar";
import TopProgressBar from "@/components/common/TopProgressBar";

export const metadata: Metadata = {
  title: "SIKAMOS STIP - Stip International Kadet Mobility System",
  description:
    "Platform digitalisasi tata kelola pertukaran kadet (mobilitas internasional) Sekolah Tinggi Ilmu Pelayaran (STIP) Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 flex flex-col antialiased">
        {/* Top Striped Loading Progress Bar */}
        <TopProgressBar />

        <SessionProvider>
          {/* Navigation Bar Berbasis RBAC Whitelist */}
          <Navbar />

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div
                  className="relative w-8 h-8 flex-shrink-0"
                  style={{ width: "32px", height: "32px", position: "relative" }}
                >
                  <Image
                    src="/images/stip-logo.png"
                    alt="STIP Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">
                    Sekolah Tinggi Ilmu Pelayaran (STIP) Indonesia
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Badan Pengembangan Sumber Daya Manusia Perhubungan (BPSDM)
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                SIKAMOS © 2026 • STIP International Kadet Mobility System
              </p>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
