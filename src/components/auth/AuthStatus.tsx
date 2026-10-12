"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, User, ShieldCheck, Clock } from "lucide-react";

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse" />
    );
  }

  if (!session || !session.user) {
    return (
      <Link
        href="/login"
        className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0A2540] font-bold text-xs transition shadow-sm"
      >
        Masuk / Login
      </Link>
    );
  }

  const role = (session.user as any).role || "KADET";
  const nrp = (session.user as any).nrp;
  const username = (session.user as any).username;
  const isCadet = role === "KADET";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const idLabel = isCadet ? "NRP" : "NIP";
  const idVal = isCadet ? nrp : (username || nrp);
  const displayId = idVal ? `${idLabel}: ${idVal}` : session.user.email;

  return (
    <div className="flex items-center space-x-3">
      {isSuperAdmin && (
        <div className="hidden lg:flex items-center space-x-1">
          <Link
            href="/admin/users"
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-purple-300 bg-purple-900/30 hover:bg-purple-900/50 transition flex items-center space-x-1 border border-purple-400/40"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>Manajemen Role</span>
          </Link>
          <Link
            href="/admin/login-history"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition flex items-center space-x-1"
          >
            <Clock className="w-3.5 h-3.5 text-slate-300" />
            <span>Audit Log</span>
          </Link>
        </div>
      )}

      {/* User Info Capsule with Link to /profil */}
      <div className="flex items-center space-x-2.5 pl-2 border-l border-white/20">
        <Link
          href="/profil"
          className="flex items-center space-x-2 group hover:opacity-90 transition p-1 rounded-lg hover:bg-white/10"
          title="Lihat & Edit Profil Saya"
        >
          {session.user.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={session.user.image}
              alt={session.user.name || "Foto Profil"}
              className="w-8 h-8 rounded-full object-cover border border-[#D4AF37] shadow-sm flex-shrink-0 bg-slate-800"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center text-xs font-bold flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
          )}

          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition line-clamp-1 max-w-[140px]">
              {session.user.name}
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              {displayId}
            </div>
          </div>
        </Link>

        <Link
          href="/profil"
          className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase transition hover:scale-105 ${
            role === "SUPER_ADMIN"
              ? "bg-purple-500/30 text-purple-200 border-purple-400"
              : role === "ADMIN"
              ? "bg-blue-500/30 text-blue-200 border-blue-400"
              : role === "DOSEN_STIP"
              ? "bg-emerald-500/30 text-emerald-200 border-emerald-400"
              : role === "MITRA"
              ? "bg-amber-500/30 text-amber-200 border-amber-400"
              : "bg-[#D4AF37]/30 text-[#D4AF37] border-[#D4AF37]"
          }`}
          title="Role Pengguna - Buka Profil"
        >
          {role}
        </Link>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600/80 text-slate-300 hover:text-white transition"
          title="Keluar (Logout)"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
