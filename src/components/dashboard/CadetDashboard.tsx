"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  FileText,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building2,
  Sparkles,
  ExternalLink,
  Award,
} from "lucide-react";

interface CadetDashboardProps {
  userName?: string | null;
  nrp?: string | null;
  kelas?: string | null;
}

export default function CadetDashboard({ userName, nrp, kelas }: CadetDashboardProps) {
  // Tanggal Hari Ini format Indonesia
  const todayDateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [logsCount, setLogsCount] = useState(0);
  const [reportStatus, setReportStatus] = useState("DRAFT");
  const [immigrationStatus, setImmigrationStatus] = useState<string | null>(null);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [universityName, setUniversityName] = useState("Universitas Maritim Mitra");
  const [countryName, setCountryName] = useState("Luar Negeri");

  // Hitung hari mobilitas
  const startDate = new Date(2026, 1, 1); // 1 Feb 2026
  const endDate = new Date(2026, 6, 31); // 31 Jul 2026
  const now = new Date();
  const diffDaysElapsed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const diffDaysRemaining = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  useEffect(() => {
    if (!nrp) return;

    // 1. Ambil profil kadet
    fetch(`/api/cadets?search=${encodeURIComponent(nrp)}&limit=1`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const c = json.data[0];
          if (c.university?.name) setUniversityName(c.university.name);
          if (c.university?.country?.name) setCountryName(c.university.country.name);
        }
      })
      .catch(() => {});

    // 2. Ambil log harian
    fetch(`/api/daily-logs?kadetId=${encodeURIComponent(nrp)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setLogsCount(json.data.length);
          const todayISO = now.toISOString().split("T")[0];
          const foundToday = json.data.some((l: any) => l.date && l.date.startsWith(todayISO));
          setHasSubmittedToday(foundToday);
        }
      })
      .catch(() => {});

    // 3. Ambil laporan akhir
    fetch(`/api/reports?kadetId=${encodeURIComponent(nrp)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setReportStatus(json.data[0].status || "DRAFT");
        }
      })
      .catch(() => {});

    // 4. Ambil dokumen imigrasi
    fetch(`/api/immigration?nrp=${encodeURIComponent(nrp)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setImmigrationStatus(json.data.status || "PENDING");
        }
      })
      .catch(() => {});
  }, [nrp]);

  // Status timeline dinamis berbasis database riil
  const isImmigrationVerified = immigrationStatus === "VERIFIED";
  const isImmigrationUploaded = Boolean(immigrationStatus);
  const isReportSubmitted = reportStatus === "SUBMITTED";
  const isApprovedMitra = reportStatus === "APPROVED_BY_MITRA" || reportStatus === "APPROVED_BY_STIP";
  const isApprovedStip = reportStatus === "APPROVED_BY_STIP";

  const timelineSteps = [
    {
      step: 1,
      title: "Paspor RI & Berkas",
      desc: isImmigrationUploaded ? "Biodata Terdaftar" : "Belum Diunggah",
      status: isImmigrationUploaded ? "COMPLETED" : "IN_PROGRESS",
    },
    {
      step: 2,
      title: "Visa & Asuransi",
      desc: isImmigrationVerified ? "Visa & Asuransi Sah" : "Menunggu Verifikasi",
      status: isImmigrationVerified ? "COMPLETED" : isImmigrationUploaded ? "IN_PROGRESS" : "PENDING",
    },
    {
      step: 3,
      title: "Jurnal Harian",
      desc: `${logsCount} Logbook Terkirim (< 1MB)`,
      status: logsCount > 0 ? "COMPLETED" : "IN_PROGRESS",
    },
    {
      step: 4,
      title: "Persetujuan Mitra",
      desc: isApprovedMitra ? "Disetujui Host Univ" : isReportSubmitted ? "Menunggu E-Sign" : "Laporan Belum Diajukan",
      status: isApprovedMitra ? "COMPLETED" : isReportSubmitted ? "IN_PROGRESS" : "PENDING",
    },
    {
      step: 5,
      title: "Pengesahan STIP",
      desc: isApprovedStip ? "Disahkan (Learning Recognition)" : "Konversi Nilai Akhir",
      status: isApprovedStip ? "COMPLETED" : isApprovedMitra ? "IN_PROGRESS" : "PENDING",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Banner Sapaan Kadet */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#102A45] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>PORTAL LAYANAN MANDIRI KADET MOBILITAS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Datang, {userName || "Kadet STIP"}!
          </h1>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-300">
            <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-bold">
              NRP: {nrp || "-"}
            </span>
            <span>•</span>
            <span className="font-semibold">{kelas || "D4 - Nautika"}</span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-[#D4AF37]">
              <Building2 className="w-3.5 h-3.5" />
              <span>{universityName} — {countryName}</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
            Program Pertukaran Kadet Internasional Periode Genap 2026. Pastikan seluruh aktivitas terlaporkan secara berkala melalui modul Jurnal Harian.
          </p>

          {/* Call to Action Utama */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/monitoring"
              className="inline-flex items-center space-x-2 px-5 py-3 bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0A2540] rounded-xl text-xs font-black transition shadow-md group"
            >
              <Compass className="w-4 h-4 text-[#0A2540] group-hover:rotate-45 transition duration-300" />
              <span>Tulis Jurnal Hari Ini</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/imigrasi"
              className="inline-flex items-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition"
            >
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>Periksa Berkas Imigrasi</span>
            </Link>

            <Link
              href="/laporan-akhir"
              className="inline-flex items-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition"
            >
              <Award className="w-4 h-4" />
              <span>Status Laporan Akhir</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Notifikasi Personal: Peringatan Jurnal Hari Ini */}
      {!hasSubmittedToday && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                Peringatan: Anda Belum Mengisi Jurnal Kegiatan Hari Ini!
              </div>
              <p className="text-[11px] text-amber-700">
                Hari {todayDateStr}. Segera unggah foto dokumentasi kegiatan berstempel waktu (otomatis kompresi &lt; 1MB) sebelum pukul 23:59.
              </p>
            </div>
          </div>
          <Link
            href="/monitoring"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition self-end sm:self-center flex-shrink-0"
          >
            <span>Isi Jurnal Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Status Bar (Timeline Tahapan Mobilitas) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Alur Progres Tahapan Mobilitas Anda</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pelacakan status legalitas, pelaporan aktivitas, hingga pengesahan konversi nilai akhir.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {timelineSteps.map((s) => {
            const isCompleted = s.status === "COMPLETED";
            const isInProgress = s.status === "IN_PROGRESS";

            return (
              <div
                key={s.step}
                className={`p-3.5 rounded-2xl border transition relative ${
                  isCompleted
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                    : isInProgress
                    ? "bg-blue-50 border-blue-300 text-blue-950 ring-2 ring-blue-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? "bg-emerald-200 text-emerald-800"
                        : isInProgress
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Tahap {s.step}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : isInProgress ? (
                    <Clock className="w-4 h-4 text-blue-600" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                  )}
                </div>
                <div className="font-bold text-xs">{s.title}</div>
                <div className="text-[10px] opacity-80 mt-0.5 line-clamp-2">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Widget Statistik Personal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Hari Terlewati
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
              {diffDaysElapsed} Hari
            </span>
            <span className="text-[10px] text-blue-600 font-semibold">Mulai 01 Feb 2026</span>
          </div>
          <Calendar className="w-8 h-8 text-[#0A2540]/25" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Sisa Waktu
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#0A2540] mt-1 block">
              {diffDaysRemaining} Hari
            </span>
            <span className="text-[10px] text-slate-500">Target s.d. 31 Jul 2026</span>
          </div>
          <Clock className="w-8 h-8 text-[#D4AF37]/50" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Jurnal Terisi
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1 block">
              {logsCount} Log
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">Foto &lt; 1MB Valid</span>
          </div>
          <Compass className="w-8 h-8 text-emerald-500/25" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Status Laporan
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-600 mt-1 block">
              {reportStatus}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">
              {reportStatus === "APPROVED_BY_STIP"
                ? "Disahkan STIP Indonesia"
                : reportStatus === "APPROVED_BY_MITRA"
                ? "Disetujui Mitra"
                : reportStatus === "SUBMITTED"
                ? "Menunggu Review Mitra"
                : "Belum Diajukan (Draft)"}
            </span>
          </div>
          <Award className="w-8 h-8 text-amber-500/25" />
        </div>
      </div>
    </div>
  );
}
