"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  Monitor,
  User,
  ArrowLeft,
  Calendar,
  AlertCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function AdminLoginHistoryPage() {
  const [histories, setHistories] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalLogins: 0, successCount: 0, failedCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHistories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (roleFilter) params.set("role", roleFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/admin/login-history?${params.toString()}`);
      if (res.status === 403) {
        setErrorMessage("Akses ditolak: Hanya SUPER_ADMIN yang memiliki otorisasi melihat Audit Log.");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setHistories(json.data);
        if (json.stats) setStats(json.stats);
        if (json.pagination) {
          setTotalLogs(json.pagination.total);
          setTotalPages(json.pagination.totalPages || 1);
        } else if (json.total !== undefined) {
          setTotalLogs(json.total);
          setTotalPages(Math.ceil(json.total / pageSize) || 1);
        }
      } else {
        setErrorMessage(json.message || "Gagal memuat audit log.");
      }
    } catch (err) {
      console.error("Gagal load history:", err);
      setErrorMessage("Koneksi gagal saat memuat audit log.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterUpdate = (setter: (val: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setRoleFilter("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchHistories();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, statusFilter, roleFilter, startDate, endDate, pageSize, currentPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#102A45] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full text-xs font-bold text-purple-200 mb-2">
            <Clock className="w-3.5 h-3.5 text-purple-300" />
            <span>AUDIT TRAIL &amp; RIWAYAT KEAMANAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Login History &amp; Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Rekaman kronologis setiap percobaan masuk ke sistem SIKAMOS STIP. Mencatat stempel waktu, IP address, user agent, status keberhasilan, dan alasan penolakan.
          </p>
        </div>

        <Link
          href="/admin/users"
          className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl border border-white/20 transition flex items-center space-x-1.5 text-xs shadow-md"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Kembali ke Manajemen Role</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">
              Total Percobaan Masuk
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats.totalLogins}
            </span>
            <span className="text-[10px] text-slate-500">Sesi terekam audit log</span>
          </div>
          <Clock className="w-8 h-8 text-[#0A2540]/30" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase block">
              Login Berhasil
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {stats.successCount}
            </span>
            <span className="text-[10px] text-emerald-600">Autentikasi Valid</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase block">
              Percobaan Gagal
            </span>
            <span className="text-2xl font-black text-rose-700 mt-1 block">
              {stats.failedCount}
            </span>
            <span className="text-[10px] text-rose-500">Kata Sandi Salah / Ditangguhkan</span>
          </div>
          <XCircle className="w-8 h-8 text-rose-500/30" />
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-800 text-xs sm:text-sm">
          <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Pencarian */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari email, NRP, IP, atau alasan gagal..."
              value={search}
              onChange={(e) => handleFilterUpdate(setSearch, e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A2540]"
            />
          </div>

          {/* Pengaturan View Jumlah Data Per Halaman */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 flex-shrink-0">
            <span className="text-xs font-bold text-slate-600">Lihat per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="text-xs font-extrabold text-[#0A2540] bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-[#0A2540] cursor-pointer"
            >
              <option value={25}>25 Log</option>
              <option value={50}>50 Log</option>
              <option value={100}>100 Log</option>
            </select>
          </div>
        </div>

        {/* Filter Baris Kedua: Status, Role & Tanggal */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => handleFilterUpdate(setStatusFilter, e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A2540] bg-white font-medium text-xs text-slate-700"
            >
              <option value="">Semua Status</option>
              <option value="SUCCESS">Hanya SUCCESS (Berhasil)</option>
              <option value="FAILED">Hanya FAILED (Gagal)</option>
            </select>

            {/* Filter Peran */}
            <select
              value={roleFilter}
              onChange={(e) => handleFilterUpdate(setRoleFilter, e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A2540] bg-white font-medium text-xs text-slate-700"
            >
              <option value="">Semua Peran</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="DOSEN_STIP">DOSEN_STIP</option>
              <option value="MITRA">MITRA</option>
              <option value="KADET">KADET</option>
            </select>

            {/* Rentang Tanggal Inline */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleFilterUpdate(setStartDate, e.target.value)}
                className="bg-transparent text-[11px] text-slate-700 focus:outline-none"
                title="Tanggal Mulai"
              />
              <span className="text-slate-400 text-[10px]">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleFilterUpdate(setEndDate, e.target.value)}
                className="bg-transparent text-[11px] text-slate-700 focus:outline-none"
                title="Tanggal Akhir"
              />
            </div>

            {(search || statusFilter || roleFilter || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition text-xs flex items-center gap-1 border border-rose-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          <button
            onClick={fetchHistories}
            className="p-1.5 rounded-xl text-slate-500 hover:text-[#0A2540] hover:bg-slate-100 transition flex items-center gap-1 font-semibold text-xs"
            title="Segarkan Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Login History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Waktu (WIB)</th>
                <th className="py-3.5 px-4">Identifier / Email Dicoba</th>
                <th className="py-3.5 px-4">Akun Terkait</th>
                <th className="py-3.5 px-4">Peran</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Alasan / Catatan Audit</th>
                <th className="py-3.5 px-4">IP Address &amp; User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat rekaman audit...
                  </td>
                </tr>
              ) : histories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada rekaman riwayat login yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                histories.map((h) => {
                  const dateStr = new Date(h.createdAt).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "medium",
                  });
                  const isSuccess = h.status === "SUCCESS";
                  const roleName = h.roleAttempted || h.user?.role || "-";

                  return (
                    <tr key={h.id} className={`hover:bg-slate-50/70 transition ${!isSuccess ? "bg-rose-50/30" : ""}`}>
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                        {dateStr}
                      </td>

                      {/* Email / Identifier Dicoba */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {h.emailAttempted}
                      </td>

                      {/* User Account */}
                      <td className="py-3 px-4">
                        {h.user ? (
                          <div>
                            <div className="font-semibold text-slate-900">{h.user.name}</div>
                            <div className="text-[10px] text-slate-400">{h.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">(Tidak Terdaftar)</span>
                        )}
                      </td>

                      {/* Peran */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {roleName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isSuccess
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {isSuccess ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              SUCCESS
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              FAILED
                            </>
                          )}
                        </span>
                      </td>

                      {/* Fail Reason */}
                      <td className="py-3 px-4">
                        {isSuccess ? (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            Autentikasi Sah
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-700 font-semibold flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span>{h.failReason || "Autentikasi Ditolak"}</span>
                          </span>
                        )}
                      </td>

                      {/* IP & User Agent */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="block text-slate-800 font-semibold">
                          {h.ipAddress || "127.0.0.1"}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block max-w-xs" title={h.userAgent}>
                          {h.userAgent || "Web Browser"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan{" "}
            <span className="font-bold text-slate-900">
              {totalLogs === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-900">
              {Math.min(currentPage * pageSize, totalLogs)}
            </span>{" "}
            dari total{" "}
            <span className="font-bold text-slate-900">{totalLogs.toLocaleString("id-ID")}</span> log
            {totalPages > 1 && ` (Halaman ${currentPage} dari ${totalPages})`}
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={isLoading}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                    currentPage === pageNum
                      ? "bg-[#0A2540] text-white shadow-sm"
                      : "bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition flex items-center gap-1"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
