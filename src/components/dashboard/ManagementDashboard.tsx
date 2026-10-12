"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Globe2,
  Building2,
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Compass,
  Award,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ManagementDashboardProps {
  isSuperAdmin: boolean;
}

export default function ManagementDashboard({ isSuperAdmin }: ManagementDashboardProps) {
  const [stats, setStats] = useState({
    totalCadets: 0,
    totalUniversities: 0,
    totalCountries: 0,
    pendingReports: 0,
    verifiedImmigration: 0,
    failedLoginsToday: 0,
  });

  const [prodiStats, setProdiStats] = useState<any[]>([]);
  const [countryPartners, setCountryPartners] = useState<any[]>([]);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);

  useEffect(() => {
    // Ambil metrik statistik terpusat dari database riil
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          if (json.stats) setStats(json.stats);
          if (json.prodiStats) setProdiStats(json.prodiStats);
          if (json.countryPartners) setCountryPartners(json.countryPartners);
        }
      })
      .catch(() => {});

    // Ambil metrik riwayat login jika Super Admin
    if (isSuperAdmin) {
      fetch("/api/admin/login-history?limit=5")
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setRecentLogins(json.data || []);
            if (json.stats?.failedCount !== undefined) {
              setStats((prev) => ({ ...prev, failedLoginsToday: json.stats.failedCount }));
            }
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  return (
    <div className="space-y-8">
      {/* Banner Utama Level Manajemen */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#102A45] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {isSuperAdmin
                ? "DASHBOARD UTAMA SUPER ADMIN (BPSDM / STIP)"
                : "DASHBOARD OPERASIONAL MOBILITAS STIP INDONESIA"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            SIKAMOS (STIP International Kadet Mobility System)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Monitoring terpusat atas 1.544 akun kadet STIP, jejaring universitas maritim dunia, legalitas imigrasi, dan pengesahan konversi SKS berstandar IMO STCW.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/kadet"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0A2540] rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Kelola Database Kadet</span>
            </Link>

            <Link
              href="/mitra"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition"
            >
              <Globe2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Master Universitas Mitra</span>
            </Link>

            {isSuperAdmin && (
              <Link
                href="/admin/users"
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-sm border border-purple-400/40"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Manajemen Role &amp; Suspend</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Peringatan Keamanan & Audit (Khusus Super Admin) */}
      {isSuperAdmin && stats.failedLoginsToday > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                Peringatan Audit Keamanan: {stats.failedLoginsToday} Percobaan Login Gagal Terekam
              </div>
              <p className="text-[11px] text-amber-700">
                Terdapat aktivitas masuk dengan kredensial salah atau akun tidak terdaftar. Periksa log audit lengkap.
              </p>
            </div>
          </div>
          <Link
            href="/admin/login-history"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition self-end sm:self-center"
          >
            <span>Buka Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Widget Metrik Global */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Kadet Aktif
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
              {stats.totalCadets.toLocaleString("id-ID")}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">100% Akun Terverifikasi</span>
          </div>
          <Users className="w-8 h-8 text-[#0A2540]/25" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Mitra Universitas
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#0A2540] mt-1 block">
              {stats.totalUniversities}
            </span>
            <span className="text-[10px] text-blue-600 font-semibold">{stats.totalCountries} Negara Maritim</span>
          </div>
          <Building2 className="w-8 h-8 text-blue-500/25" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Imigrasi Terverifikasi
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block">
              {stats.verifiedImmigration}
            </span>
            <span className="text-[10px] text-slate-500">Paspor &amp; Visa Sah</span>
          </div>
          <FileCheck2 className="w-8 h-8 text-emerald-500/25" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Laporan Menunggu
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
              {stats.pendingReports}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">Perlu E-Sign Pengesahan</span>
          </div>
          <Award className="w-8 h-8 text-amber-500/25" />
        </div>
      </div>

      {/* Grid Grafik & Sebaran */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Distribusi Program Studi */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#0A2540]" />
              <span>Distribusi Program Studi Kadet Mobilitas</span>
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
              STIP Indonesia
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {prodiStats.map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{p.name}</span>
                  <span className="font-mono">{p.count} Kadet ({p.percent})</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.color}`} style={{ width: p.percent }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Standar Kurikulum IMO STCW 1978 amdt. 2010</span>
            <Link href="/kadet" className="text-blue-700 font-bold hover:underline">
              Lihat Detail Kadet →
            </Link>
          </div>
        </div>

        {/* Kolom Kanan: Sebaran Negara Tujuan Mobilitas */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Globe2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Jejaring Negara &amp; Universitas Mitra Maritim</span>
            </h2>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
              {countryPartners.length} Kampus Dunia
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {countryPartners.map((c) => (
              <div
                key={c.name}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{c.flag}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{c.partner}</div>
                    <div className="text-[10px] text-slate-500">{c.name}</div>
                  </div>
                </div>
                <span className="text-xs font-black font-mono text-[#0A2540] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                  {c.count} Kadet
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Riwayat Audit Terakhir (Khusus Super Admin) */}
      {isSuperAdmin && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Audit Trail: 5 Aktivitas Masuk Sistem Terakhir</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pemantauan sesi login secara real-time untuk menjamin keamanan sistem.
              </p>
            </div>
            <Link
              href="/admin/login-history"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1"
            >
              <span>Semua Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-3">Identifier / Email</th>
                  <th className="py-2 px-3">Peran</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Alasan / Catatan</th>
                  <th className="py-2 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentLogins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      Belum ada data audit terekam.
                    </td>
                  </tr>
                ) : (
                  recentLogins.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {l.emailAttempted}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700">
                          {l.roleAttempted || l.user?.role || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {l.status === "SUCCESS" ? (
                          <span className="inline-flex items-center text-emerald-700 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-700 font-bold text-[10px]">
                            <XCircle className="w-3 h-3 mr-1" />
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {l.failReason || "Autentikasi Sah"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                        {l.ipAddress || "127.0.0.1"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

