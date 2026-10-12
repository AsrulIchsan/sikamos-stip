"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileCheck2,
  Upload,
  Calendar,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  File,
  Loader2,
  AlertCircle,
  Inbox,
  User,
  HeartPulse,
  Stamp,
  Globe2,
  Check,
  X,
  Send,
  Building2,
  Info,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";

interface ImmigrationDocItem {
  id: string;
  kadetId: string;
  pasporNo?: string | null;
  ttl?: string | null;
  pasporExpiry?: string | null;
  pasporFileUrl?: string | null;
  visaNo?: string | null;
  visaType?: string | null;
  visaExpiry?: string | null;
  visaFileUrl?: string | null;
  insuranceNo?: string | null;
  insuranceProvider?: string | null;
  insuranceExpiry?: string | null;
  insuranceFileUrl?: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  kadet: {
    id: string;
    nrp: string;
    kelas?: string;
    semester?: number;
    user?: {
      id: string;
      name: string;
      email: string;
      username?: string | null;
    };
    university?: {
      id: string;
      name: string;
      country?: {
        name: string;
        code: string;
      };
    } | null;
  };
}

interface CadetSelfDoc {
  id?: string;
  pasporNo?: string | null;
  ttl?: string | null;
  pasporExpiry?: string | null;
  pasporFileUrl?: string | null;
  visaNo?: string | null;
  visaType?: string | null;
  visaExpiry?: string | null;
  visaFileUrl?: string | null;
  insuranceNo?: string | null;
  insuranceProvider?: string | null;
  insuranceExpiry?: string | null;
  insuranceFileUrl?: string | null;
  status?: "PENDING" | "VERIFIED" | "REJECTED";
  notes?: string | null;
}

export default function ImigrasiPage() {
  const { user, isCadet, isManagement, isValidator } = useRBAC();

  // Mode Tampilan: Admin secara default membuka inbox verifikasi, Kadet membuka form mandiri
  const [activeView, setActiveView] = useState<"inbox" | "form">(
    isCadet ? "form" : "inbox"
  );

  // Set default view based on user role once user is loaded
  useEffect(() => {
    if (isManagement || isValidator) {
      setActiveView("inbox");
    } else if (isCadet) {
      setActiveView("form");
    }
  }, [isManagement, isValidator, isCadet]);

  // =========================================================================
  // STATE INBOX VERIFIKASI ADMIN & VALIDATOR
  // =========================================================================
  const [inboxDocs, setInboxDocs] = useState<ImmigrationDocItem[]>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);
  const [inboxSearch, setInboxSearch] = useState("");
  const [inboxStatusFilter, setInboxStatusFilter] = useState("");
  const [inboxLimit, setInboxLimit] = useState(25);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });

  // Modal Inspeksi & Verifikasi Berkas Kadet
  const [inspectedDoc, setInspectedDoc] = useState<ImmigrationDocItem | null>(null);
  const [verifierNotes, setVerifierNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // =========================================================================
  // STATE FORMULIR MANDIRI KADET
  // =========================================================================
  const [pasporNo, setPasporNo] = useState("");
  const [ttl, setTtl] = useState("");
  const [pasporExpiry, setPasporExpiry] = useState("");
  const [selectedPasporFile, setSelectedPasporFile] = useState<File | null>(null);
  const [pasporFileUrl, setPasporFileUrl] = useState<string | null>(null);

  const [visaNo, setVisaNo] = useState("");
  const [visaType, setVisaType] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [selectedVisaFile, setSelectedVisaFile] = useState<File | null>(null);
  const [visaFileUrl, setVisaFileUrl] = useState<string | null>(null);

  const [insuranceNo, setInsuranceNo] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [selectedInsuranceFile, setSelectedInsuranceFile] = useState<File | null>(null);
  const [insuranceFileUrl, setInsuranceFileUrl] = useState<string | null>(null);

  const [cadetNotes, setCadetNotes] = useState("");
  const [myDocId, setMyDocId] = useState<string | null>(null);
  const [myStatus, setMyStatus] = useState<"PENDING" | "VERIFIED" | "REJECTED">("PENDING");
  const [kadetInfo, setKadetInfo] = useState<any>(null);

  const [isLoadingMyDoc, setIsLoadingMyDoc] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // =========================================================================
  // FETCH INBOX VERIFIKASI ADMIN
  // =========================================================================
  const loadInboxDocs = useCallback(async () => {
    setIsLoadingInbox(true);
    try {
      const params = new URLSearchParams();
      if (inboxStatusFilter) params.set("status", inboxStatusFilter);
      if (inboxSearch.trim()) params.set("search", inboxSearch.trim());

      const res = await fetch(`/api/immigration?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setInboxDocs(json.data);
        if (json.stats) {
          setStats(json.stats);
        } else {
          // Fallback stats calculation
          const total = json.data.length;
          const pending = json.data.filter((d: any) => d.status === "PENDING").length;
          const verified = json.data.filter((d: any) => d.status === "VERIFIED").length;
          const rejected = json.data.filter((d: any) => d.status === "REJECTED").length;
          setStats({ total, pending, verified, rejected });
        }
      } else {
        setInboxDocs([]);
      }
    } catch (err) {
      console.error("Gagal memuat inbox verifikasi imigrasi:", err);
    } finally {
      setIsLoadingInbox(false);
    }
  }, [inboxStatusFilter, inboxSearch]);

  useEffect(() => {
    if (isManagement || isValidator) {
      loadInboxDocs();
    }
  }, [isManagement, isValidator, loadInboxDocs]);

  // =========================================================================
  // FETCH FORMULIR MANDIRI KADET
  // =========================================================================
  const loadMyImmigrationDoc = async () => {
    if (!user) return;
    setIsLoadingMyDoc(true);
    try {
      const identifier = (user as any)?.nrp || user.id;
      const res = await fetch(
        `/api/immigration?nrp=${encodeURIComponent(identifier)}&userId=${encodeURIComponent(user.id)}`
      );
      const json = await res.json();
      if (json.success) {
        if (json.kadet) {
          setKadetInfo(json.kadet);
          if (json.kadet.pasporNo && !json.data?.pasporNo) {
            setPasporNo(json.kadet.pasporNo);
          }
        }
        if (json.data) {
          const d: CadetSelfDoc = json.data;
          setMyDocId(d.id || null);
          if (d.pasporNo) setPasporNo(d.pasporNo);
          if (d.ttl) setTtl(d.ttl);
          if (d.pasporExpiry) setPasporExpiry(new Date(d.pasporExpiry).toISOString().split("T")[0]);
          if (d.pasporFileUrl) setPasporFileUrl(d.pasporFileUrl);

          if (d.visaNo) setVisaNo(d.visaNo);
          if (d.visaType) setVisaType(d.visaType);
          if (d.visaExpiry) setVisaExpiry(new Date(d.visaExpiry).toISOString().split("T")[0]);
          if (d.visaFileUrl) setVisaFileUrl(d.visaFileUrl);

          if (d.insuranceNo) setInsuranceNo(d.insuranceNo);
          if (d.insuranceProvider) setInsuranceProvider(d.insuranceProvider);
          if (d.insuranceExpiry) setInsuranceExpiry(new Date(d.insuranceExpiry).toISOString().split("T")[0]);
          if (d.insuranceFileUrl) setInsuranceFileUrl(d.insuranceFileUrl);

          if (d.status) setMyStatus(d.status);
          if (d.notes) setCadetNotes(d.notes);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data mandiri imigrasi:", err);
    } finally {
      setIsLoadingMyDoc(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyImmigrationDoc();
    }
  }, [user]);

  // =========================================================================
  // HANDLER VERIFIKASI ADMIN (SETUJUI / TOLAK)
  // =========================================================================
  const handleVerifySubmission = async (newStatus: "VERIFIED" | "REJECTED") => {
    if (!inspectedDoc) return;
    setIsVerifying(true);
    setNotification(null);

    try {
      const res = await fetch("/api/immigration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: inspectedDoc.id,
          kadetId: inspectedDoc.kadetId,
          status: newStatus,
          notes: verifierNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNotification({
          type: "success",
          text: `Dokumen kadet ${inspectedDoc.kadet?.user?.name || inspectedDoc.kadet?.nrp} berhasil diubah statusnya menjadi ${
            newStatus === "VERIFIED" ? "TERVERIFIKASI" : "PERLU PERBAIKAN (DITOLAK)"
          }!`,
        });

        // Update local state and reload inbox
        setInspectedDoc(null);
        setVerifierNotes("");
        loadInboxDocs();
      } else {
        setNotification({ type: "error", text: json.message || "Gagal memperbarui status verifikasi." });
      }
    } catch (err) {
      setNotification({ type: "error", text: "Terjadi kesalahan jaringan saat memverifikasi berkas." });
    } finally {
      setIsVerifying(false);
    }
  };

  // =========================================================================
  // HANDLER SUBMIT FORM MANDIRI KADET
  // =========================================================================
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUploading(true);
    setNotification(null);

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      if ((user as any)?.nrp) formData.append("nrp", (user as any).nrp);

      formData.append("pasporNo", pasporNo.trim());
      formData.append("ttl", ttl.trim());
      if (pasporExpiry) formData.append("pasporExpiry", pasporExpiry);
      if (selectedPasporFile) formData.append("pasporFile", selectedPasporFile);

      formData.append("visaNo", visaNo.trim());
      formData.append("visaType", visaType.trim());
      if (visaExpiry) formData.append("visaExpiry", visaExpiry);
      if (selectedVisaFile) formData.append("visaFile", selectedVisaFile);

      formData.append("insuranceNo", insuranceNo.trim());
      formData.append("insuranceProvider", insuranceProvider.trim());
      if (insuranceExpiry) formData.append("insuranceExpiry", insuranceExpiry);
      if (selectedInsuranceFile) formData.append("insuranceFile", selectedInsuranceFile);

      if (cadetNotes) formData.append("notes", cadetNotes.trim());

      const res = await fetch("/api/immigration", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setNotification({
          type: "success",
          text: "Dokumen imigrasi berhasil disimpan dan diajukan untuk verifikasi BPSDM!",
        });
        if (json.data) {
          const d = json.data;
          setMyDocId(d.id || null);
          if (d.pasporFileUrl) setPasporFileUrl(d.pasporFileUrl);
          if (d.visaFileUrl) setVisaFileUrl(d.visaFileUrl);
          if (d.insuranceFileUrl) setInsuranceFileUrl(d.insuranceFileUrl);
          if (d.status) setMyStatus(d.status);
        }
        setSelectedPasporFile(null);
        setSelectedVisaFile(null);
        setSelectedInsuranceFile(null);
      } else {
        setNotification({
          type: "error",
          text: json.message || "Gagal menyimpan dokumen imigrasi.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Terjadi kesalahan jaringan saat mengunggah berkas.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const pasporComplete = Boolean(pasporNo && (selectedPasporFile || pasporFileUrl));
  const visaComplete = Boolean(visaNo && (selectedVisaFile || visaFileUrl));
  const insuranceComplete = Boolean(insuranceNo && (selectedInsuranceFile || insuranceFileUrl));
  const totalCompleted = [pasporComplete, visaComplete, insuranceComplete].filter(Boolean).length;
  const completionPercentage = Math.round((totalCompleted / 3) * 100);

  const isPasporExpiringSoon = pasporExpiry
    ? new Date(pasporExpiry).getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 180
    : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#0E355A] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-[#D4AF37]/30 px-3 py-1 rounded-full text-xs font-semibold text-[#D4AF37]">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Modul 4: Pengelolaan Dokumen Imigrasi &amp; Legalitas Mobilitas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dokumen Imigrasi &amp; Verifikasi Legalitas Kadet
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pusat pengarsipan dan otorisasi berkas paspor internasional, visa studi / izin tinggal luar negeri, serta polis asuransi maritim kadet STIP Indonesia.
            </p>
          </div>

          {/* Quick Stats Banner untuk Tim Verifikator */}
          {(isManagement || isValidator) && (
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center flex-shrink-0 shadow-sm flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                  Pending Review
                </span>
                <span className="text-2xl font-black text-amber-400">{stats.pending}</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">
                  Terverifikasi
                </span>
                <span className="text-2xl font-black text-emerald-400">{stats.verified}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifikasi Global */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-sm shadow-sm transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigasi Tab (Bagi Admin yang juga ingin melihat form mandiri) */}
      {(isManagement || isValidator) && (
        <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm space-x-2">
          <button
            onClick={() => setActiveView("inbox")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition ${
              activeView === "inbox"
                ? "bg-[#0A2540] text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Ruang Verifikasi Pengajuan Kadet (Admin / BPSDM)</span>
            <span className="ml-1.5 bg-amber-400 text-[#0A2540] text-[10px] font-black px-2 py-0.5 rounded-full">
              {stats.pending} Pending
            </span>
          </button>

          <button
            onClick={() => setActiveView("form")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition ${
              activeView === "form"
                ? "bg-[#0A2540] text-white shadow-md"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-4 h-4 text-[#D4AF37]" />
            <span>Formulir Pengajuan Dokumen Mandiri</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 1: INBOX VERIFIKASI PENGJUAN IMIGRASI (ADMIN & BPSDM)             */}
      {/* ========================================================================= */}
      {activeView === "inbox" && (isManagement || isValidator) ? (
        <div className="space-y-6">
          {/* Filter, Search & Statistik Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                onClick={() => setInboxStatusFilter("")}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  inboxStatusFilter === ""
                    ? "bg-[#0A2540] text-white border-[#0A2540]"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                  Total Pengajuan
                </span>
                <span className="text-xl font-black mt-0.5 block">{stats.total} Berkas</span>
              </div>

              <div
                onClick={() => setInboxStatusFilter("PENDING")}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  inboxStatusFilter === "PENDING"
                    ? "bg-amber-500 text-white border-amber-600"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                  Menunggu Verifikasi
                </span>
                <span className="text-xl font-black mt-0.5 block">{stats.pending} Kadet</span>
              </div>

              <div
                onClick={() => setInboxStatusFilter("VERIFIED")}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  inboxStatusFilter === "VERIFIED"
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                  Telah Terverifikasi
                </span>
                <span className="text-xl font-black mt-0.5 block">{stats.verified} Kadet</span>
              </div>

              <div
                onClick={() => setInboxStatusFilter("REJECTED")}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  inboxStatusFilter === "REJECTED"
                    ? "bg-rose-600 text-white border-rose-700"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200"
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                  Perlu Perbaikan
                </span>
                <span className="text-xl font-black mt-0.5 block">{stats.rejected} Kadet</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan Nama, NRP, Nomor Paspor, atau Visa..."
                  value={inboxSearch}
                  onChange={(e) => setInboxSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A2540]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={inboxStatusFilter}
                  onChange={(e) => setInboxStatusFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2540]"
                >
                  <option value="">Semua Status Pengajuan</option>
                  <option value="PENDING">Menunggu Verifikasi (PENDING)</option>
                  <option value="VERIFIED">Terverifikasi (VERIFIED)</option>
                  <option value="REJECTED">Perlu Perbaikan (REJECTED)</option>
                </select>

                <button
                  onClick={loadInboxDocs}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title="Muat Ulang"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabel Pengajuan Kadet */}
          {isLoadingInbox ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#0A2540]" />
              <p className="text-sm font-semibold">Memeriksa antrean pengajuan imigrasi kadet...</p>
            </div>
          ) : inboxDocs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                {inboxStatusFilter || inboxSearch
                  ? "Tidak Ada Berkas yang Sesuai Filter"
                  : "Belum Ada Pengajuan Dokumen Imigrasi"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {inboxStatusFilter || inboxSearch
                  ? "Coba ubah kata kunci pencarian atau reset filter status pengajuan."
                  : "Kadet yang mengunggah dokumen paspor, visa, dan asuransi akan muncul dalam antrean verifikasi ini."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Kadet STIP</th>
                      <th className="py-3.5 px-4">Universitas Tujuan</th>
                      <th className="py-3.5 px-4">Paspor RI</th>
                      <th className="py-3.5 px-4">Visa Studi</th>
                      <th className="py-3.5 px-4">Asuransi</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {inboxDocs.map((item) => {
                      const kName = item.kadet?.user?.name || "Kadet STIP";
                      const uniName = item.kadet?.university?.name || "Belum Ditentukan";
                      const countryCode = item.kadet?.university?.country?.code || "";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                          onClick={() => {
                            setInspectedDoc(item);
                            setVerifierNotes(item.notes || "");
                          }}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#0A2540] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {kName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div>
                                <strong className="text-slate-900 block font-bold">{kName}</strong>
                                <span className="font-mono text-[11px] text-blue-700 font-semibold">
                                  NRP: {item.kadet?.nrp}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800 line-clamp-1">{uniName}</p>
                            {countryCode && (
                              <span className="text-[10px] font-mono text-slate-500">
                                ({countryCode})
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            {item.pasporNo ? (
                              <span className="font-bold text-slate-800">{item.pasporNo}</span>
                            ) : (
                              <span className="text-slate-400 italic">Belum diisi</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {item.visaNo ? (
                              <span className="font-mono text-slate-800">{item.visaNo}</span>
                            ) : (
                              <span className="text-slate-400 italic">Belum diisi</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {item.insuranceNo ? (
                              <span className="font-mono text-slate-800">{item.insuranceNo}</span>
                            ) : (
                              <span className="text-slate-400 italic">Belum diisi</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                item.status === "VERIFIED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : item.status === "REJECTED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {item.status === "VERIFIED" ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : item.status === "REJECTED" ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span>
                                {item.status === "VERIFIED"
                                  ? "TERVERIFIKASI"
                                  : item.status === "REJECTED"
                                  ? "PERLU PERBAIKAN"
                                  : "PENDING"}
                              </span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedDoc(item);
                                setVerifierNotes(item.notes || "");
                              }}
                              className="px-3 py-1.5 bg-[#0A2540] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs transition inline-flex items-center space-x-1 shadow-sm"
                            >
                              <span>Periksa &amp; Verifikasi</span>
                              <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODAL INSPEKSI & VERIFIKASI BERKAS KADET (ADMIN & BPSDM) */}
          {/* ======================================================== */}
          {inspectedDoc && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl my-8 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                {/* Header Modal */}
                <div className="bg-gradient-to-r from-[#0A2540] to-[#1E3A8A] p-6 text-white flex items-start justify-between flex-shrink-0">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold bg-[#D4AF37] text-[#0A2540] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Verifikasi Legalitas Imigrasi Kadet
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black mt-1 text-white">
                      {inspectedDoc.kadet?.user?.name || "Kadet STIP"}
                    </h3>
                    <p className="text-xs text-slate-300 font-mono">
                      NRP: {inspectedDoc.kadet?.nrp} • {inspectedDoc.kadet?.kelas || "Kadet"}
                    </p>
                  </div>
                  <button
                    onClick={() => setInspectedDoc(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body Rincian Berkas (Scrollable) */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="font-bold text-slate-700">Status Legalitas Saat Ini:</span>
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        inspectedDoc.status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : inspectedDoc.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {inspectedDoc.status === "VERIFIED" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : inspectedDoc.status === "REJECTED" ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>
                        {inspectedDoc.status === "VERIFIED"
                          ? "TERVERIFIKASI BPSDM"
                          : inspectedDoc.status === "REJECTED"
                          ? "PERLU PERBAIKAN"
                          : "MENUNGGU VERIFIKASI"}
                      </span>
                    </span>
                  </div>

                  {/* 1. Paspor RI */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2 font-bold text-slate-900">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>1. Paspor Republik Indonesia</span>
                      </div>
                      {inspectedDoc.pasporFileUrl ? (
                        <a
                          href={inspectedDoc.pasporFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-blue-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat / Unduh File Scan</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">File belum diunggah</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Nomor Paspor
                        </span>
                        <strong className="font-mono text-slate-800">
                          {inspectedDoc.pasporNo || "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Tempat, Tanggal Lahir (TTL)
                        </span>
                        <span className="text-slate-700">{inspectedDoc.ttl || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Berlaku Hingga
                        </span>
                        <span className="text-slate-700">
                          {inspectedDoc.pasporExpiry
                            ? new Date(inspectedDoc.pasporExpiry).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Visa Studi */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2 font-bold text-slate-900">
                        <Stamp className="w-4 h-4 text-amber-600" />
                        <span>2. Visa Studi / Izin Tinggal</span>
                      </div>
                      {inspectedDoc.visaFileUrl ? (
                        <a
                          href={inspectedDoc.visaFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-xs flex items-center gap-1 border border-amber-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat / Unduh File Scan</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">File belum diunggah</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Nomor Visa / Permit
                        </span>
                        <strong className="font-mono text-slate-800">
                          {inspectedDoc.visaNo || "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Kategori Visa
                        </span>
                        <span className="text-slate-700">{inspectedDoc.visaType || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Berlaku Hingga
                        </span>
                        <span className="text-slate-700">
                          {inspectedDoc.visaExpiry
                            ? new Date(inspectedDoc.visaExpiry).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Asuransi Kesehatan */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2 font-bold text-slate-900">
                        <HeartPulse className="w-4 h-4 text-emerald-600" />
                        <span>3. Polis Asuransi Kesehatan Maritim</span>
                      </div>
                      {inspectedDoc.insuranceFileUrl ? (
                        <a
                          href={inspectedDoc.insuranceFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs flex items-center gap-1 border border-emerald-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat / Unduh Polis</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">File belum diunggah</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Nomor Polis
                        </span>
                        <strong className="font-mono text-slate-800">
                          {inspectedDoc.insuranceNo || "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Penyedia / Asuradur
                        </span>
                        <span className="text-slate-700">
                          {inspectedDoc.insuranceProvider || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Berlaku Hingga
                        </span>
                        <span className="text-slate-700">
                          {inspectedDoc.insuranceExpiry
                            ? new Date(inspectedDoc.insuranceExpiry).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Verifikasi BPSDM / Admin STIP */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                        Keputusan Verifikator BPSDM / Dosen STIP
                      </h4>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Catatan Feedback untuk Kadet (Wajib diisi jika menolak/minta perbaikan)
                      </label>
                      <textarea
                        rows={2}
                        value={verifierNotes}
                        onChange={(e) => setVerifierNotes(e.target.value)}
                        placeholder="Contoh: Dokumen paspor telah terverifikasi sah. Atau: Scan visa blur, mohon unggah ulang halaman pertama..."
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        disabled={isVerifying}
                        onClick={() => handleVerifySubmission("VERIFIED")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow disabled:opacity-50"
                      >
                        {isVerifying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Setujui (VERIFIED)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isVerifying}
                        onClick={() => handleVerifySubmission("REJECTED")}
                        className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow disabled:opacity-50"
                      >
                        {isVerifying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span>Minta Perbaikan (REJECTED)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setInspectedDoc(null)}
                    className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* TAMPILAN 2: FORMULIR PENGJUAN MANDIRI KADET                               */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI (7 Kolom): FORMULIR UPLOAD */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleUploadSubmit} className="space-y-6">
              {/* CARD 1: DOKUMEN PASPOR REPUBLIK INDONESIA */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 transition-all hover:border-slate-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        1. Paspor Republik Indonesia
                      </h3>
                      <p className="text-xs text-slate-500">
                        Identitas paspor resmi kadet untuk perjalanan ke luar negeri
                      </p>
                    </div>
                  </div>
                  {pasporComplete ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Lengkap
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      Belum Lengkap
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Nomor Paspor RI <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: B1234567 atau X987654"
                      value={pasporNo}
                      onChange={(e) => setPasporNo(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none font-mono placeholder:text-slate-400 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Tempat, Tanggal Lahir (TTL)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Jakarta, 15 Mei 2003"
                      value={ttl}
                      onChange={(e) => setTtl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Masa Berlaku Paspor Hingga (Expiry Date)
                    </label>
                    {isPasporExpiringSoon && (
                      <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Kurang dari 6 Bulan
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={pasporExpiry}
                    onChange={(e) => setPasporExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none"
                  />
                </div>

                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Unggah Berkas Scan Paspor (Halaman Identitas &amp; Tanda Tangan)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    onChange={(e) => setSelectedPasporFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0A2540] file:text-[#D4AF37] hover:file:bg-[#1E3A8A] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Berkas saat ini:{" "}
                      <span className="font-semibold text-slate-800">
                        {selectedPasporFile?.name || (pasporFileUrl ? "Scan_Paspor_RI_Aktif.pdf" : "Belum diunggah")}
                      </span>
                    </span>
                    {pasporFileUrl && (
                      <a
                        href={pasporFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 2: DOKUMEN VISA STUDI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 transition-all hover:border-slate-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                      <Stamp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        2. Visa Studi / Izin Tinggal Negara Mitra
                      </h3>
                      <p className="text-xs text-slate-500">
                        Dokumen legalitas izin tinggal dan studi di institusi mitra maritim
                      </p>
                    </div>
                  </div>
                  {visaComplete ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Lengkap
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      Belum Lengkap
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Nomor Visa / Permit <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: V-SWE-88291039 / D-99120"
                      value={visaNo}
                      onChange={(e) => setVisaNo(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none font-mono placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Jenis / Kategori Visa
                    </label>
                    <input
                      type="text"
                      list="visa-types"
                      placeholder="Contoh: Schengen Student Visa (Type D)"
                      value={visaType}
                      onChange={(e) => setVisaType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none placeholder:text-slate-400"
                    />
                    <datalist id="visa-types">
                      <option value="Schengen Student Visa (Type D)" />
                      <option value="National Maritime Trainee Visa" />
                      <option value="Short-stay Study Visa (Type C)" />
                      <option value="Residence Permit for Higher Education" />
                      <option value="C-1/D Seafarer & Trainee Visa" />
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Masa Berlaku Visa Hingga (Expiry Date)
                  </label>
                  <input
                    type="date"
                    value={visaExpiry}
                    onChange={(e) => setVisaExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none"
                  />
                </div>

                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Unggah Berkas Scan Visa / Izin Tinggal Resmi
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    onChange={(e) => setSelectedVisaFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0A2540] file:text-[#D4AF37] hover:file:bg-[#1E3A8A] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Berkas saat ini:{" "}
                      <span className="font-semibold text-slate-800">
                        {selectedVisaFile?.name || (visaFileUrl ? "Scan_Visa_Studi_Aktif.pdf" : "Belum diunggah")}
                      </span>
                    </span>
                    {visaFileUrl && (
                      <a
                        href={visaFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 3: DOKUMEN ASURANSI KESEHATAN */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 transition-all hover:border-slate-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        3. Asuransi Kesehatan &amp; Keterangan Medis
                      </h3>
                      <p className="text-xs text-slate-500">
                        Perlindungan medis darurat &amp; repatriasi maritim internasional
                      </p>
                    </div>
                  </div>
                  {insuranceComplete ? (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Lengkap
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      Belum Lengkap
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Nomor Polis Asuransi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: POL-MAR-2026-98124"
                      value={insuranceNo}
                      onChange={(e) => setInsuranceNo(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none font-mono placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Penyedia / Asuradur (Provider)
                    </label>
                    <input
                      type="text"
                      list="insurance-providers"
                      placeholder="Contoh: BPJS Ketenagakerjaan Pelaut / P&I Club"
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none placeholder:text-slate-400"
                    />
                    <datalist id="insurance-providers">
                      <option value="BPJS Ketenagakerjaan Pelaut" />
                      <option value="The Standard P&I Club" />
                      <option value="Allianz Global Maritime Care" />
                      <option value="AXA International Seafarer Protection" />
                      <option value="Chubb Marine Health Cover" />
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Masa Berlaku Perlindungan Polis Hingga
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiry}
                    onChange={(e) => setInsuranceExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none"
                  />
                </div>

                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Unggah Bukti Polis Asuransi &amp; Ringkasan Manfaat
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    onChange={(e) => setSelectedInsuranceFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0A2540] file:text-[#D4AF37] hover:file:bg-[#1E3A8A] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Berkas saat ini:{" "}
                      <span className="font-semibold text-slate-800">
                        {selectedInsuranceFile?.name || (insuranceFileUrl ? "Polis_Asuransi_Sah.pdf" : "Belum diunggah")}
                      </span>
                    </span>
                    {insuranceFileUrl && (
                      <a
                        href={insuranceFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* CATATAN TAMBAHAN KADET */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Catatan Tambahan untuk Verifikator BPSDM / Dosen STIP (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={cadetNotes}
                  onChange={(e) => setCadetNotes(e.target.value)}
                  placeholder="Contoh: Berkas visa fisik telah terbit dan e-Visa terlampir. Menunggu stempel imigrasi di bandara."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* TOMBOL SIMPAN */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-gradient-to-r from-[#0A2540] to-[#1E3A8A] hover:from-[#0E355A] hover:to-[#2546A5] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm sm:text-base shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                    <span>Menyimpan &amp; Mengunggah Berkas Imigrasi...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#D4AF37]" />
                    <span>Simpan &amp; Ajukan Semua Berkas Imigrasi</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* KOLOM KANAN (5 Kolom): STATUS KESIAPAN & PREVIEW */}
          <div className="lg:col-span-5 space-y-6">
            {/* Status Kesiapan Berkas */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-[#0A2540]" />
                  Status Kesiapan Legalitas
                </h3>
                <span className="text-xs font-black text-[#0A2540] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  {completionPercentage}% Lengkap
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#0A2540] to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div
                  className={`p-2 rounded-xl border ${
                    pasporComplete ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  <p className="font-bold">Paspor</p>
                  <span className="text-[10px]">{pasporComplete ? "Siap" : "Belum"}</span>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    visaComplete ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  <p className="font-bold">Visa</p>
                  <span className="text-[10px]">{visaComplete ? "Siap" : "Belum"}</span>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    insuranceComplete ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  <p className="font-bold">Asuransi</p>
                  <span className="text-[10px]">{insuranceComplete ? "Siap" : "Belum"}</span>
                </div>
              </div>
            </div>

            {/* Catatan Verifikator jika ada */}
            {cadetNotes && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong className="block font-bold">Catatan Pengajuan:</strong>
                <p>{cadetNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
