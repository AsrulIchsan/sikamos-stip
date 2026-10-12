"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Info,
  UserCheck,
} from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam === "suspended") {
      setErrorMessage("Akun Anda telah ditangguhkan (Suspended). Silakan hubungi Super Administrator STIP.");
    }
  }, [errorParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Mohon lengkapi ID (NRP / NIP / Email) dan Kata Sandi.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: identifier.trim(),
        password: password.trim(),
      });

      if (res?.error) {
        setErrorMessage(
          res.error === "Akun Anda telah dinonaktifkan. Hubungi Administrator STIP."
            ? res.error
            : "Identitas (NRP / NIP / Email) atau Kata Sandi tidak sesuai. Silakan periksa kembali."
        );
        setIsLoading(false);
        return;
      }

      // Pengalihan langsung agar tidak stuck di status memverifikasi kredensial
      window.location.href = callbackUrl || "/";
    } catch (err: unknown) {
      setErrorMessage("Terjadi gangguan koneksi saat memproses autentikasi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Kolom Kiri: Identitas Resmi SIKAMOS STIP INDONESIA */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#0A2540] via-[#102A45] to-[#1E3A8A] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div
              className="relative w-20 h-20 bg-white/10 rounded-2xl p-2 border border-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0"
              style={{ width: "80px", height: "80px", position: "relative" }}
            >
              <Image
                src="/images/stip-logo.png"
                alt="Logo Resmi STIP Indonesia"
                width={72}
                height={72}
                className="w-full h-full object-contain p-1"
                priority
              />
            </div>
            <div>
              <span className="text-[10px] bg-[#D4AF37]/30 border border-[#D4AF37] text-[#D4AF37] font-bold px-2 py-0.5 rounded uppercase">
                Portal Otentikasi Terpadu
              </span>
              <h2 className="text-2xl font-black mt-2 text-white">SIKAMOS</h2>
              <p className="text-xs text-slate-300 font-medium">
                STIP International Kadet Mobility System
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sekolah Tinggi Ilmu Pelayaran (STIP) INDONESIA
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Keamanan Sistem Terintegrasi:</span>
            </p>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Setiap sesi pengguna dilindungi Role-Based Access Control (RBAC). Percobaan akses terekam otomatis dalam Audit Trail resmi.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Form Login Produksi Bersih */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Masuk ke Akun Anda</h3>
            <p className="text-xs text-slate-500 mt-1">
              Silakan masukkan kredensial Anda untuk mengakses portal mobilitas studi.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Panduan Kredensial Pengguna */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
              <Info className="w-3.5 h-3.5 text-[#0A2540]" />
              <span>Petunjuk Akses Masuk:</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>
                • <strong>Kadet Mahasiswa STIP:</strong> Gunakan <strong>Nomor Registrasi Pokok (NRP)</strong> resmi Anda sebagai Username/ID Pengguna.
              </p>
              <p>
                • <strong>Dosen, Mitra &amp; Administrator:</strong> Masuk menggunakan <strong>Nomor Induk Pegawai (NIP)</strong>, Username, atau <strong>Alamat Email Resmi</strong> yang telah terdaftar.
              </p>
            </div>
          </div>

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                Username, NRP (Kadet), NIP (Pegawai), atau Email *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Kadet: Masukkan NRP | Pegawai: Masukkan NIP / Username / Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                Kata Sandi *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Kadet: Masukkan NRP Anda | Pegawai: Masukkan Kata Sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0A2540] hover:bg-[#1E3A8A] text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 text-xs sm:text-sm shadow-md disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Memverifikasi Kredensial...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem SIKAMOS</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#0A2540] animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
