"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import DailyLogForm from "@/components/daily-log/DailyLogForm";
import DailyLogList, { DailyLogItem } from "@/components/daily-log/DailyLogList";
import {
  Compass,
  Building2,
  Calendar,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  Award,
  AlertCircle,
  Info,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";

function MonitoringContent() {
  const { role, user, isCadet, isValidator, isManagement } = useRBAC();
  const searchParams = useSearchParams();
  const queryKadetId = searchParams.get("kadetId");

  const [logs, setLogs] = useState<DailyLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kadetInfo, setKadetInfo] = useState<{
    id: string;
    name: string;
    nrp: string;
    kelas: string;
    semester: number;
    university: string;
    country: string;
  } | null>(null);

  // Resolusi profil kadet aktif
  useEffect(() => {
    const resolveCadet = async () => {
      const targetParam = queryKadetId || (user as any)?.nrp || user?.id;
      if (!targetParam) return;

      try {
        const res = await fetch(`/api/cadets?search=${encodeURIComponent(targetParam)}&limit=1`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const c = json.data[0];
          setKadetInfo({
            id: c.id,
            name: c.user?.name || "Kadet STIP",
            nrp: c.nrp,
            kelas: c.kelas,
            semester: c.semester,
            university: c.university?.name || "World Maritime University (WMU)",
            country: c.university?.country?.name || "Swedia (Sweden)",
          });
        } else if (isCadet && user) {
          setKadetInfo({
            id: user.id,
            name: user.name || "Kadet STIP",
            nrp: (user as any)?.nrp || "-",
            kelas: (user as any)?.kelas || "D4 - Nautika",
            semester: 8,
            university: "World Maritime University (WMU)",
            country: "Swedia (Sweden)",
          });
        }
      } catch (err) {
        console.error("Gagal memuat profil kadet:", err);
      }
    };

    resolveCadet();
  }, [queryKadetId, user, isCadet]);

  // Fetch log dari API tanpa fallback mock data
  const fetchLogs = async () => {
    const targetId = kadetInfo?.id || queryKadetId || (user as any)?.nrp || user?.id;
    if (!targetId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/daily-logs?kadetId=${encodeURIComponent(targetId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Gagal mengambil log harian:", err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (kadetInfo || user) {
      fetchLogs();
    }
  }, [kadetInfo, user]);

  const displayName = kadetInfo?.name || (isCadet ? user?.name : "Monitoring Jurnal Kadet");
  const displayNrp = kadetInfo?.nrp || ((user as any)?.nrp || "-");
  const displayKelas = kadetInfo?.kelas || ((user as any)?.kelas || "D4 - Nautika");
  const displaySem = kadetInfo?.semester || 8;
  const displayUni = kadetInfo?.university || "Universitas Maritim Mitra";
  const displayCountry = kadetInfo?.country || "Luar Negeri";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profil Banner Kadet dengan Logo Resmi STIP */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div
            className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-slate-50 rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center justify-center"
            style={{ width: "72px", height: "72px", position: "relative" }}
          >
            <Image
              src="/images/stip-logo.png"
              alt="Logo Resmi STIP"
              width={64}
              height={64}
              className="w-full h-full object-contain p-1"
              priority
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {displayName}
              </h1>
              {displayNrp !== "-" && (
                <span className="text-xs bg-[#0A2540] text-[#D4AF37] font-bold px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40 shadow-xs">
                  {kadetInfo || isCadet ? `NRP: ${displayNrp}` : `NIP: ${displayNrp}`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-slate-700">{displayKelas}</span>
              <span>•</span>
              <span>Semester {displaySem}</span>
              <span>•</span>
              <span className="flex items-center text-slate-800 font-medium">
                <Building2 className="w-3.5 h-3.5 mr-1 text-[#0A2540]" />
                {displayUni}, {displayCountry}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto text-center">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Total Jurnal
            </span>
            <span className="text-lg font-black text-slate-800">{logs.length}</span>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              Tervalidasi
            </span>
            <span className="text-lg font-black text-emerald-700">
              {logs.filter((l) => l.feedback).length}
            </span>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-100">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              Kompresi Foto
            </span>
            <span className="text-lg font-black text-amber-700">&lt; 1MB</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form di Kiri (Hanya Kadet), Galeri di Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Form Input Jurnal (Hanya Kadet) ATAU Panel Pembimbing (Untuk Dosen / Mitra) */}
        <div className="lg:col-span-5 space-y-4">
          {isCadet ? (
            <DailyLogForm
              kadetId={kadetInfo?.id || (user as any)?.nrp || user?.id || ""}
              kadetName={displayName || "Kadet"}
              nrp={displayNrp}
              onSuccess={fetchLogs}
            />
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {role === "DOSEN_STIP"
                      ? "Panel Evaluasi Dosen STIP"
                      : role === "MITRA"
                      ? "Panel Verifikasi Mitra (Host Univ)"
                      : "Panel Monitoring Manajemen"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Otorisasi Evaluator &amp; Pembimbing Lapangan
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
                <div className="font-bold flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-blue-700 flex-shrink-0" />
                  <span>Petunjuk Evaluasi Jurnal:</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] space-y-1 text-blue-800 leading-relaxed">
                  <li>
                    Periksa bukti dokumentasi kegiatan foto dan <strong>stempel waktu (timestamp watermark)</strong> yang tersemat otomatis.
                  </li>
                  <li>
                    Klik tombol <strong>&ldquo;Beri Catatan&rdquo;</strong> pada masing-masing kartu jurnal untuk memberikan umpan balik kepada kadet.
                  </li>
                  <li>
                    Seluruh catatan evaluasi akan tercatat secara permanen di Berita Acara Laporan Akhir.
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                <span className="font-semibold block text-slate-800">Status Kompresi Berkas:</span>
                <p className="text-[11px] text-slate-500">
                  Semua foto jurnal diproses dengan kompresi sisi-klien di bawah 1MB untuk memastikan efisiensi bandwidth internasional.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Timeline & Galeri Jurnal */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Compass className="w-5 h-5 mr-2 text-[#0A2540]" />
              Riwayat Jurnal Kegiatan Harian
            </h2>
            <button
              onClick={fetchLogs}
              className="text-xs text-[#0A2540] hover:text-[#1E3A8A] font-semibold flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan Data</span>
            </button>
          </div>

          <DailyLogList logs={logs} isLoading={isLoading} onRefresh={fetchLogs} />
        </div>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A2540]" />
          <p className="text-sm font-semibold">Memuat modul monitoring mobilitas...</p>
        </div>
      }
    >
      <MonitoringContent />
    </Suspense>
  );
}
