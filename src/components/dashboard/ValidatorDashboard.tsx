"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Award,
  Compass,
  GraduationCap,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertCircle,
  Eye,
  PenTool,
  Loader2,
  Inbox,
} from "lucide-react";

interface ValidatorDashboardProps {
  role: "DOSEN_STIP" | "MITRA";
  userName?: string | null;
}

export default function ValidatorDashboard({ role, userName }: ValidatorDashboardProps) {
  const isDosen = role === "DOSEN_STIP";

  const [mentoredCadets, setMentoredCadets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ambil data laporan atau kadet bimbingan riil dari API
    const loadValidatorData = async () => {
      setIsLoading(true);
      try {
        const targetStatus = isDosen ? "APPROVED_BY_MITRA" : "SUBMITTED";
        const res = await fetch(`/api/reports?status=${targetStatus}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map((r: any) => ({
            id: r.id,
            kadetId: r.kadet?.id,
            name: r.kadet?.user?.name || "Kadet STIP",
            nrp: r.kadet?.nrp || "-",
            kelas: r.kadet?.kelas || "-",
            university: r.kadet?.university?.name || "World Maritime University",
            country: r.kadet?.university?.country?.name || "Swedia (Sweden)",
            reportStatus: r.status,
            lastActivity: r.title || "Laporan Akhir Mobilitas",
            avatar: r.kadet?.fotoProfil || null,
          }));
          setMentoredCadets(mapped);
        } else {
          setMentoredCadets([]);
        }
      } catch (err) {
        console.error("Gagal memuat data bimbingan:", err);
        setMentoredCadets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadValidatorData();
  }, [isDosen]);

  const pendingReportsCount = mentoredCadets.length;
  const totalPendingLogs = 0;

  return (
    <div className="space-y-8">
      {/* Banner Sapaan Pembimbing */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden ${
          isDosen
            ? "bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#0f766e]"
            : "bg-gradient-to-r from-[#78350f] via-[#b45309] to-[#d97706]"
        }`}
      >
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/15 border border-white/25 px-3 py-1 rounded-full text-xs font-bold text-white mb-3">
            {isDosen ? <ShieldCheck className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
            <span>
              {isDosen
                ? "PORTAL DOSEN PEMBIMBING INTERNAL STIP INDONESIA"
                : "PORTAL PEMBIMBING UNIVERSITAS MITRA (HOST UNIVERSITY)"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Bertugas, {userName || (isDosen ? "Dosen STIP" : "Pembimbing Mitra")}
          </h1>

          <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed">
            {isDosen
              ? "Validasi akhir pencapaian kompetensi kadet STIP di universitas maritim dunia untuk konversi SKS kurikulum IMO STCW."
              : "Verifikasi pelaksanaan kegiatan praktik dan tanda tangani laporan akhir mobilitas internasional kadet."}
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/laporan-akhir"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-sm"
            >
              <PenTool className="w-4 h-4 text-[#D4AF37]" />
              <span>Validasi &amp; Bubuhkan E-Sign</span>
            </Link>

            <Link
              href="/monitoring"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition"
            >
              <Compass className="w-4 h-4" />
              <span>Review Jurnal Harian</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Widget Antrean Tugas (Validator Task Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tugas 1: Menunggu E-Sign */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              Menunggu Tanda Tangan E-Sign
            </span>
            <span className="text-3xl font-black text-amber-900 mt-1 block">
              {pendingReportsCount} Laporan
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">
              {isDosen ? "Tahap 2: Pengesahan STIP" : "Tahap 1: Verifikasi Mitra"}
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Tugas 2: Jurnal Menunggu Umpan Balik */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
              Jurnal Menunggu Review
            </span>
            <span className="text-3xl font-black text-blue-900 mt-1 block">
              {totalPendingLogs} Jurnal
            </span>
            <span className="text-[10px] text-slate-500">Perlu evaluasi / umpan balik</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Compass className="w-6 h-6" />
          </div>
        </div>

        {/* Tugas 3: Total Kadet Bimbingan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Kadet Dalam Antrean
            </span>
            <span className="text-3xl font-black text-emerald-900 mt-1 block">
              {mentoredCadets.length} Kadet
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">Memerlukan Validasi</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabel Cepat: Kadet di Bawah Pengawasan / Bimbingan */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-[#0A2540]" />
              <span>Daftar Kadet Membutuhkan Validasi ({mentoredCadets.length} Mahasiswa)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Hanya menampilkan kadet yang telah mengajukan laporan akhir untuk evaluasi Anda.
            </p>
          </div>

          <Link
            href="/monitoring"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
          >
            <span>Buka Monitoring Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Nama Kadet</th>
                <th className="py-3 px-4">NRP / Kelas</th>
                <th className="py-3 px-4">Universitas Tujuan</th>
                <th className="py-3 px-4">Aktivitas Terakhir</th>
                <th className="py-3 px-4 text-center">Status Laporan</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0A2540]" />
                    <span>Memeriksa antrean bimbingan...</span>
                  </td>
                </tr>
              ) : mentoredCadets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <div className="w-12 h-12 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-2">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-700 text-xs">Belum Ada Kadet yang Memerlukan Tindakan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Seluruh jurnal dan laporan kadet dalam kondisi tervalidasi atau belum ada laporan baru yang diajukan.
                    </p>
                  </td>
                </tr>
              ) : (
                mentoredCadets.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#0A2540] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {c.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-800">{c.nrp}</div>
                      <div className="text-[10px] text-slate-400">{c.kelas}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{c.university}</div>
                      <div className="text-[10px] text-slate-400">{c.country}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{c.lastActivity}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          c.reportStatus === "APPROVED_BY_STIP"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : c.reportStatus === "APPROVED_BY_MITRA"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {c.reportStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/monitoring?kadetId=${c.kadetId || c.id}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          Jurnal
                        </Link>
                        <Link
                          href="/laporan-akhir"
                          className="px-2.5 py-1 bg-[#0A2540] hover:bg-[#1E3A8A] text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1"
                        >
                          <PenTool className="w-3 h-3 text-[#D4AF37]" />
                          <span>E-Sign</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
