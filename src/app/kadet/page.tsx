"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  FileCheck2,
  ShieldCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  User,
  Filter,
  X,
  RefreshCw,
  Eye,
  FileText,
  Stamp,
  HeartPulse,
  Download,
  Clock,
  AlertTriangle,
  MapPin,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";
import Authorize from "@/components/auth/Authorize";

interface KadetItem {
  id: string;
  userId: string;
  nrp: string;
  kelas: string;
  semester: number;
  pasporNo: string | null;
  fotoProfil: string | null;
  programName: string | null;
  startDate?: string | null;
  endDate?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  university: {
    id: string;
    name: string;
    country: {
      name: string;
      code: string;
    };
  } | null;
  dosenStip?: {
    id: string;
    name: string;
    email: string;
  } | null;
  mitra?: {
    id: string;
    name: string;
    email: string;
  } | null;
  immigrationDoc?: {
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
    status: string;
    notes?: string | null;
  } | null;
  _count?: {
    dailyLogs: number;
  };
}

export default function KadetPage() {
  const { role, isManagement, isCadet, isMitra, maskInfo, user } = useRBAC();

  const [cadets, setCadets] = useState<KadetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(25);
  const [selectedProdi, setSelectedProdi] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedPassport, setSelectedPassport] = useState("");
  const [selectedImmig, setSelectedImmig] = useState("");

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });

  // Modal Detail Kadet Drill-Down
  const [selectedCadetDetail, setSelectedCadetDetail] = useState<KadetItem | null>(null);
  const [cadetLogs, setCadetLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"profil" | "imigrasi" | "jurnal">("profil");

  // Modal Tambah Kadet
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNrp, setNewNrp] = useState("");
  const [newKelas, setNewKelas] = useState("D4 - Nautika");
  const [newSemester, setNewSemester] = useState("8");
  const [newPaspor, setNewPaspor] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUniId, setNewUniId] = useState("");
  const [universitiesList, setUniversitiesList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Cadets from Database API
  const fetchCadets = useCallback(
    async (
      searchQuery: string = searchTerm,
      pageNum: number = page,
      pageSizeNum: number = limit,
      prodiFilter: string = selectedProdi,
      semesterFilter: string = selectedSemester,
      passportFilter: string = selectedPassport,
      immigFilter: string = selectedImmig
    ) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (prodiFilter) params.set("prodi", prodiFilter);
        if (semesterFilter) params.set("semester", semesterFilter);
        if (passportFilter) params.set("hasPassport", passportFilter);
        if (immigFilter) params.set("immigrationStatus", immigFilter);
        params.set("page", String(pageNum));
        params.set("limit", String(pageSizeNum));

        const res = await fetch(`/api/cadets?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCadets(data.data);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        } else {
          setCadets([]);
        }
      } catch (err) {
        console.error("Gagal memuat database kadet:", err);
        setCadets([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, page, limit, selectedProdi, selectedSemester, selectedPassport, selectedImmig]
  );

  // Fetch Available Partner Universities for Modal
  useEffect(() => {
    fetch("/api/partners/universities")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setUniversitiesList(json.data);
          if (json.data.length > 0) {
            setNewUniId(json.data[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Debounced Search and Filters Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCadets(
        searchTerm,
        page,
        limit,
        selectedProdi,
        selectedSemester,
        selectedPassport,
        selectedImmig
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [
    searchTerm,
    page,
    limit,
    selectedProdi,
    selectedSemester,
    selectedPassport,
    selectedImmig,
    fetchCadets,
  ]);

  // Handle Detail Kadet Click
  const handleOpenCadetDetail = async (cadet: KadetItem) => {
    setSelectedCadetDetail(cadet);
    setActiveDetailTab("profil");
    setCadetLogs([]);
    setIsLoadingLogs(true);

    try {
      const res = await fetch(`/api/daily-logs?kadetId=${encodeURIComponent(cadet.id)}&limit=50`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCadetLogs(json.data);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat jurnal kadet:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Handle Filters Reset & Updates
  const handleFilterUpdate = (setter: (val: string) => void, val: string) => {
    setter(val);
    setPage(1);
  };

  const handleLimitUpdate = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleResetAllFilters = () => {
    setSearchTerm("");
    setSelectedProdi("");
    setSelectedSemester("");
    setSelectedPassport("");
    setSelectedImmig("");
    setPage(1);
  };

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Handle Register New Cadet
  const handleAddCadet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlertMsg(null);

    try {
      const emailGenerated = newEmail.trim() || `${newNrp.trim()}@stip.ac.id`;
      const res = await fetch("/api/cadets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: emailGenerated,
          nrp: newNrp.trim(),
          kelas: newKelas.trim(),
          semester: parseInt(newSemester, 10),
          pasporNo: newPaspor.trim() || null,
          universityId: newUniId || null,
          programName: "International Cadet Mobility Program 2026",
          password: newNrp.trim(), // Default password is NRP
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAlertMsg({ type: "success", text: "Kadet baru berhasil didaftarkan ke sistem!" });
        setShowAddModal(false);
        setNewName("");
        setNewNrp("");
        setNewEmail("");
        setNewPaspor("");
        fetchCadets(searchTerm, 1);
        setPage(1);
      } else {
        setAlertMsg({ type: "error", text: json.message || "Gagal mendaftarkan kadet." });
      }
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Terjadi kesalahan jaringan." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A2540] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-[#D4AF37] mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Modul 1: Database Kadet STIP Indonesia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Database Kadet Mobilitas Studi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Data profil resmi peserta pertukaran internasional STIP Indonesia berstandar IMO STCW. Klik pada kadet untuk melihat berkas imigrasi dan riwayat jurnal harian lengkap.
          </p>
        </div>

        {/* Tombol Tambah Kadet: Hanya di-render jika SUPER_ADMIN atau ADMIN */}
        <Authorize allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
          <button
            onClick={() => {
              setAlertMsg(null);
              setShowAddModal(true);
            }}
            className="bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0A2540] font-bold px-5 py-3 rounded-xl transition flex items-center space-x-2 text-xs sm:text-sm shadow-md flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan Kadet Baru</span>
          </button>
        </Authorize>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm ${
            alertMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {alertMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Input Pencarian */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari berdasarkan NRP, Nama, Kelas, atau Paspor..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A2540]"
            />
          </div>

          {/* Pengaturan View Jumlah Data Per Halaman */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 flex-shrink-0">
            <span className="text-xs font-bold text-slate-600">Lihat per halaman:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitUpdate(Number(e.target.value))}
              className="text-xs font-extrabold text-[#0A2540] bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#0A2540] cursor-pointer"
            >
              <option value={25}>25 Kadet</option>
              <option value={50}>50 Kadet</option>
              <option value={100}>100 Kadet</option>
            </select>
          </div>
        </div>

        {/* Baris Filter Multi-Kategori */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>

            {/* Filter Jurusan / Prodi */}
            <select
              value={selectedProdi}
              onChange={(e) => handleFilterUpdate(setSelectedProdi, e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A2540] bg-white font-medium text-xs text-slate-700"
            >
              <option value="">Semua Jurusan/Prodi</option>
              <option value="NAUTIKA">D4 Nautika</option>
              <option value="TEKNIKA">D4 Teknika</option>
              <option value="KALK">D4 KALK</option>
            </select>

            {/* Filter Semester */}
            <select
              value={selectedSemester}
              onChange={(e) => handleFilterUpdate(setSelectedSemester, e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A2540] bg-white font-medium text-xs text-slate-700"
            >
              <option value="">Semua Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>

            {/* Filter Status Paspor */}
            <select
              value={selectedPassport}
              onChange={(e) => handleFilterUpdate(setSelectedPassport, e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A2540] bg-white font-medium text-xs text-slate-700"
            >
              <option value="">Status Paspor</option>
              <option value="yes">Sudah Ada Paspor</option>
              <option value="no">Belum Ada Paspor</option>
            </select>

            {/* Filter Status Imigrasi */}
            <select
              value={selectedImmig}
              onChange={(e) => handleFilterUpdate(setSelectedImmig, e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A2540] bg-white font-medium text-xs text-slate-700"
            >
              <option value="">Status Dokumen</option>
              <option value="VERIFIED">Terverifikasi (VERIFIED)</option>
              <option value="PENDING">Menunggu (PENDING)</option>
              <option value="REJECTED">Ditolak (REJECTED)</option>
            </select>

            {(searchTerm || selectedProdi || selectedSemester || selectedPassport || selectedImmig) && (
              <button
                onClick={handleResetAllFilters}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition text-xs flex items-center gap-1 border border-rose-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-semibold flex items-center space-x-3">
            {isMitra && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Nomor Paspor Disamarkan</span>
              </span>
            )}
            <span>
              Total: <span className="font-bold text-[#0A2540]">{pagination.total.toLocaleString("id-ID")}</span> Kadet
            </span>
          </div>
        </div>
      </div>

      {/* Loading Skeleton / Spinner */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A2540]" />
          <p className="text-sm font-semibold">Memuat database kadet STIP Indonesia...</p>
        </div>
      ) : cadets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm ? "Tidak Ada Kadet Ditemukan" : "Belum Ada Kadet Terdaftar"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? `Tidak ditemukan kadet dengan kata kunci "${searchTerm}". Silakan periksa kembali NRP atau ejaan nama.`
              : "Database kadet mobilitas saat ini belum memiliki data aktif. Silakan daftarkan kadet baru."}
          </p>
        </div>
      ) : (
        /* Grid of Cadet Profiles */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cadets.map((cadet) => {
            const cadetName = cadet.user?.name || "Kadet STIP";
            const isUserOwner = (user as any)?.nrp === cadet.nrp;
            const maskedPassport = maskInfo(cadet.pasporNo || "Belum ada paspor", isUserOwner);
            const docStatus = cadet.immigrationDoc?.status || "PENDING";
            const totalLogs = cadet._count?.dailyLogs || 0;
            const uniName = cadet.university?.name || "Belum ditentukan";
            const countryName = cadet.university?.country?.name || "-";

            return (
              <div
                key={cadet.id}
                onClick={() => handleOpenCadetDetail(cadet)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 cursor-pointer hover:border-[#0A2540]/40 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#D4AF37] flex-shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
                      {cadet.fotoProfil ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={cadet.fotoProfil}
                          alt={cadetName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#0A2540] flex items-center justify-center text-white font-bold text-sm tracking-wider">
                          {cadetName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-[#0A2540] transition" title={cadetName}>
                        {cadetName}
                      </h3>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        NRP: {cadet.nrp}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {cadet.kelas} (Sem. {cadet.semester})
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <p className="text-slate-700 font-semibold flex items-center line-clamp-1" title={uniName}>
                      <Building2 className="w-3.5 h-3.5 mr-1 text-[#0A2540] flex-shrink-0" />
                      {uniName}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {countryName}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <span title={isMitra ? "Disamarkan untuk Mitra" : "Nomor Paspor"}>
                        Paspor: <strong className="font-mono text-slate-700">{maskedPassport}</strong>
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {totalLogs} Jurnal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[#0A2540] group-hover:underline font-bold flex items-center space-x-1">
                    <span>Detail Kadet</span>
                    <Eye className="w-3.5 h-3.5 ml-1 text-[#D4AF37]" />
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      docStatus === "VERIFIED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : docStatus === "REJECTED"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {docStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan{" "}
            <span className="font-bold text-slate-900">
              {pagination.total === 0 ? 0 : (page - 1) * limit + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-900">
              {Math.min(page * limit, pagination.total)}
            </span>{" "}
            dari total{" "}
            <span className="font-bold text-slate-900">{pagination.total.toLocaleString("id-ID")}</span> kadet
            {pagination.totalPages > 1 && ` (Halaman ${page} dari ${pagination.totalPages})`}
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                    page === pageNum
                      ? "bg-[#0A2540] text-white shadow-sm"
                      : "bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL LENGKAP KADET (PROFIL, IMIGRASI & JURNAL)   */}
      {/* ======================================================== */}
      {selectedCadetDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl my-8 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#0A2540] to-[#1E3A8A] p-6 text-white flex items-start justify-between flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 shadow-md">
                  {selectedCadetDetail.fotoProfil ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedCadetDetail.fotoProfil}
                      alt={selectedCadetDetail.user?.name || "Kadet"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0A2540] flex items-center justify-center text-white font-bold text-lg">
                      {(selectedCadetDetail.user?.name || "KD")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold bg-[#D4AF37] text-[#0A2540] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Profil Lengkap Peserta Mobilitas
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black mt-1 text-white">
                    {selectedCadetDetail.user?.name || "Kadet STIP"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-1">
                    <span className="font-mono bg-white/10 px-2 py-0.5 rounded border border-white/20">
                      NRP: {selectedCadetDetail.nrp}
                    </span>
                    <span>•</span>
                    <span>{selectedCadetDetail.kelas} (Semester {selectedCadetDetail.semester})</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCadetDetail(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigasi Tab Detail */}
            <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0 px-6">
              <button
                onClick={() => setActiveDetailTab("profil")}
                className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                  activeDetailTab === "profil"
                    ? "border-[#0A2540] text-[#0A2540] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Biodata &amp; Mobilitas</span>
              </button>
              <button
                onClick={() => setActiveDetailTab("imigrasi")}
                className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                  activeDetailTab === "imigrasi"
                    ? "border-[#0A2540] text-[#0A2540] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Berkas Imigrasi &amp; Legalitas</span>
              </button>
              <button
                onClick={() => setActiveDetailTab("jurnal")}
                className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                  activeDetailTab === "jurnal"
                    ? "border-[#0A2540] text-[#0A2540] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Riwayat Jurnal Harian ({cadetLogs.length})</span>
              </button>
            </div>

            {/* Isi Konten Tab */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
              {/* TAB 1: BIODATA & MOBILITAS */}
              {activeDetailTab === "profil" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        <Building2 className="w-4 h-4 text-[#0A2540]" />
                        <span>Informasi Universitas Mitra</span>
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Universitas Tujuan</span>
                          <strong className="text-slate-800 font-bold text-sm">
                            {selectedCadetDetail.university?.name || "Belum Ditentukan"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Negara Mitra</span>
                          <span className="text-slate-700">
                            {selectedCadetDetail.university?.country?.name || "-"} ({selectedCadetDetail.university?.country?.code || "-"})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama Program</span>
                          <span className="text-slate-700">
                            {selectedCadetDetail.programName || "International Cadet Mobility Program 2026"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        <ShieldCheck className="w-4 h-4 text-[#0A2540]" />
                        <span>Pembimbing &amp; Akun</span>
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Dosen Pembimbing STIP</span>
                          <span className="text-slate-800 font-semibold">
                            {selectedCadetDetail.dosenStip?.name || "Dosen STIP Belum Ditugaskan"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Pembimbing Kampus Mitra</span>
                          <span className="text-slate-800 font-semibold">
                            {selectedCadetDetail.mitra?.name || "Pembimbing Mitra Belum Ditugaskan"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Alamat Email Resmi</span>
                          <span className="text-slate-700 font-mono">
                            {selectedCadetDetail.user?.email || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0A2540] text-xs">
                        Lihat Monitoring Laporan Akhir &amp; E-Sign Kadet Ini
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Akses modul validasi log harian lengkap, evaluasi mingguan, dan pengesahan laporan akhir.
                      </p>
                    </div>
                    <Link
                      href={`/monitoring?kadetId=${selectedCadetDetail.id}`}
                      className="px-4 py-2 bg-[#0A2540] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 flex-shrink-0 shadow"
                    >
                      <span>Buka Modul Monitoring</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* TAB 2: BERKAS IMIGRASI & LEGALITAS */}
              {activeDetailTab === "imigrasi" && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="font-bold text-slate-700">Status Legalitas Imigrasi:</span>
                    <span
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                        selectedCadetDetail.immigrationDoc?.status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : selectedCadetDetail.immigrationDoc?.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      <span>
                        {selectedCadetDetail.immigrationDoc?.status === "VERIFIED"
                          ? "TERVERIFIKASI BPSDM"
                          : selectedCadetDetail.immigrationDoc?.status === "REJECTED"
                          ? "PERLU PERBAIKAN (DITOLAK)"
                          : "MENUNGGU VERIFIKASI (PENDING)"}
                      </span>
                    </span>
                  </div>

                  {selectedCadetDetail.immigrationDoc?.notes && (
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>Catatan Verifikator:</strong> {selectedCadetDetail.immigrationDoc.notes}
                    </div>
                  )}

                  {/* 1. Paspor */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2 font-bold text-slate-900">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>1. Paspor Republik Indonesia</span>
                      </div>
                      {selectedCadetDetail.immigrationDoc?.pasporFileUrl ? (
                        <a
                          href={selectedCadetDetail.immigrationDoc.pasporFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-blue-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat / Unduh File Scan</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">File scan belum diunggah</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Nomor Paspor</span>
                        <strong className="font-mono text-slate-800">
                          {selectedCadetDetail.immigrationDoc?.pasporNo || selectedCadetDetail.pasporNo || "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Tempat, Tanggal Lahir</span>
                        <span className="text-slate-700">
                          {selectedCadetDetail.immigrationDoc?.ttl || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Berlaku Hingga</span>
                        <span className="text-slate-700">
                          {selectedCadetDetail.immigrationDoc?.pasporExpiry
                            ? new Date(selectedCadetDetail.immigrationDoc.pasporExpiry).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Visa */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2 font-bold text-slate-900">
                        <Stamp className="w-4 h-4 text-amber-600" />
                        <span>2. Visa Studi / Izin Tinggal</span>
                      </div>
                      {selectedCadetDetail.immigrationDoc?.visaFileUrl ? (
                        <a
                          href={selectedCadetDetail.immigrationDoc.visaFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-xs flex items-center gap-1 border border-amber-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat / Unduh File Scan</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">File scan belum diunggah</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Nomor Visa</span>
                        <strong className="font-mono text-slate-800">
                          {selectedCadetDetail.immigrationDoc?.visaNo || "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Kategori Visa</span>
                        <span className="text-slate-700">
                          {selectedCadetDetail.immigrationDoc?.visaType || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Berlaku Hingga</span>
                        <span className="text-slate-700">
                          {selectedCadetDetail.immigrationDoc?.visaExpiry
                            ? new Date(selectedCadetDetail.immigrationDoc.visaExpiry).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Asuransi */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2 font-bold text-slate-900">
                        <HeartPulse className="w-4 h-4 text-emerald-600" />
                        <span>3. Asuransi Kesehatan Maritim</span>
                      </div>
                      {selectedCadetDetail.immigrationDoc?.insuranceFileUrl ? (
                        <a
                          href={selectedCadetDetail.immigrationDoc.insuranceFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs flex items-center gap-1 border border-emerald-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat / Unduh Polis</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs italic">File polis belum diunggah</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Nomor Polis</span>
                        <strong className="font-mono text-slate-800">
                          {selectedCadetDetail.immigrationDoc?.insuranceNo || "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Penyedia / Asuradur</span>
                        <span className="text-slate-700">
                          {selectedCadetDetail.immigrationDoc?.insuranceProvider || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Berlaku Hingga</span>
                        <span className="text-slate-700">
                          {selectedCadetDetail.immigrationDoc?.insuranceExpiry
                            ? new Date(selectedCadetDetail.immigrationDoc.insuranceExpiry).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isManagement && (
                    <div className="pt-2 flex justify-end">
                      <Link
                        href="/imigrasi"
                        className="px-4 py-2 bg-[#0A2540] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                        <span>Buka Ruang Verifikasi Imigrasi</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RIWAYAT JURNAL HARIAN */}
              {activeDetailTab === "jurnal" && (
                <div className="space-y-4">
                  {isLoadingLogs ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <Loader2 className="w-7 h-7 animate-spin text-[#0A2540]" />
                      <p className="text-xs font-semibold">Memuat jurnal harian kadet...</p>
                    </div>
                  ) : cadetLogs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        Belum ada jurnal harian yang diunggah oleh kadet ini.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Kadet dapat mengisi jurnal harian secara berkala melalui Modul 5: Monitoring Mobilitas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cadetLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-bold text-slate-900 text-sm">
                                {log.activityTitle || "Kegiatan Pembelajaran / Praktik Maritim"}
                              </h5>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-3.5 h-3.5 text-[#0A2540]" />
                                <span>
                                  {new Date(log.date).toLocaleDateString("id-ID", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                                {log.locationName && (
                                  <>
                                    <span>•</span>
                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                    <span>{log.locationName}</span>
                                  </>
                                )}
                              </p>
                            </div>

                            {log.photoUrl && (
                              <a
                                href={log.photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Foto Kegiatan</span>
                              </a>
                            )}
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {log.description}
                          </p>

                          {log.feedback && (
                            <div className="text-[11px] bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200">
                              <strong className="block font-bold">Feedback Pembimbing:</strong>
                              <p>{log.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/monitoring?kadetId=${selectedCadetDetail.id}`}
                      className="px-4 py-2 bg-[#0A2540] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      <Compass className="w-4 h-4 text-[#D4AF37]" />
                      <span>Buka Modul Monitoring Lengkap</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCadetDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Kadet (Hanya untuk Management) */}
      {showAddModal && isManagement && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Daftarkan Kadet Mobilitas Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCadet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                  Nama Lengkap Kadet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Raihan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                    NRP Kadet (ID &amp; Password) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 19020492"
                    value={newNrp}
                    onChange={(e) => setNewNrp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                    Nomor Paspor RI
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: B9284719"
                    value={newPaspor}
                    onChange={(e) => setNewPaspor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                    Kelas / Jurusan *
                  </label>
                  <select
                    value={newKelas}
                    onChange={(e) => setNewKelas(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                  >
                    <option value="D4 - Nautika">D4 - Nautika</option>
                    <option value="D4 - Teknika">D4 - Teknika</option>
                    <option value="D4 - KALK">D4 - KALK</option>
                    <option value="MTr - PEMASARAN, INOVASI, DAN TEKNOLOGI">MTr - PIT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                    Semester *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                  Universitas Tujuan (Mitra) *
                </label>
                <select
                  value={newUniId}
                  onChange={(e) => setNewUniId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                >
                  {universitiesList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.country?.name || "-"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Kadet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
