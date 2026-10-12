import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-8 text-center relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-50 rounded-full pointer-events-none" />

        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>HTTP 403 - FORBIDDEN</span>
        </div>

        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          Akses Ditolak
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Anda tidak memiliki izin (otorisasi) untuk mengakses halaman atau modul ini. Halaman ini dibatasi secara ketat berdasarkan Role-Based Access Control (RBAC) SIKAMOS STIP Indonesia.
        </p>

        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left mb-6 text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">Butuh bantuan otorisasi?</p>
          <p>
            Jika Anda memerlukan akses ke modul ini, silakan hubungi <strong>Super Administrator</strong> BPSDM / STIP Indonesia untuk pembaruan hak akses role Anda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0A2540] hover:bg-[#13385e] text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Home className="w-4 h-4 text-[#D4AF37]" />
            <span>Kembali ke Beranda</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ganti Akun</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

