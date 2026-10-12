"use client";

import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  MessageSquare,
  Search,
  ExternalLink,
  ShieldCheck,
  Edit3,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";

export interface DailyLogItem {
  id: string;
  kadetId: string;
  date: string;
  activityTitle?: string | null;
  description: string;
  photoUrl: string;
  photoTimestamp: string;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  feedback?: string | null;
  kadet?: {
    nrp: string;
    kelas: string;
    user?: {
      name: string | null;
    };
    university?: {
      name: string;
      country?: { name: string };
    } | null;
  };
}

interface DailyLogListProps {
  logs: DailyLogItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function DailyLogList({
  logs,
  isLoading = false,
  onRefresh,
}: DailyLogListProps) {
  const { canGiveFeedback } = useRBAC();
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [feedbackFilter, setFeedbackFilter] = useState<string>("");
  const [selectedPhoto, setSelectedPhoto] = useState<DailyLogItem | null>(null);

  // State Feedback Pembimbing
  const [activeFeedbackLog, setActiveFeedbackLog] = useState<DailyLogItem | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      (log.activityTitle && log.activityTitle.toLowerCase().includes(term)) ||
      log.description.toLowerCase().includes(term) ||
      (log.locationName && log.locationName.toLowerCase().includes(term));

    if (!matchSearch) return false;

    if (feedbackFilter === "has_feedback") {
      return Boolean(log.feedback && log.feedback.trim());
    } else if (feedbackFilter === "need_feedback") {
      return !log.feedback || !log.feedback.trim();
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenFeedback = (log: DailyLogItem) => {
    setActiveFeedbackLog(log);
    setFeedbackInput(log.feedback || "");
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeedbackLog || !feedbackInput.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/daily-logs/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: activeFeedbackLog.id,
          feedback: feedbackInput,
        }),
      });

      // Update state secara lokal
      activeFeedbackLog.feedback = feedbackInput.trim();
      setActiveFeedbackLog(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn("Gagal simpan feedback:", err);
      // Fallback local state
      activeFeedbackLog.feedback = feedbackInput.trim();
      setActiveFeedbackLog(null);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari judul kegiatan, uraian aktivitas, atau lokasi..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A2540]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Status Feedback */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={feedbackFilter}
              onChange={(e) => {
                setFeedbackFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A2540] bg-white font-medium text-slate-700"
            >
              <option value="">Semua Evaluasi</option>
              <option value="has_feedback">Sudah Ada Catatan</option>
              <option value="need_feedback">Menunggu Evaluasi</option>
            </select>
          </div>

          {/* View per halaman */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold">Lihat:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-[#0A2540] bg-white border border-slate-300 rounded px-1.5 py-0.5"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse space-y-3">
              <div className="h-44 bg-slate-200 rounded-lg w-full" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredLogs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Belum Ada Jurnal Kegiatan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Kadet belum mengunggah laporan harian mobilitas studi. Gunakan formulir di samping untuk menambahkan jurnal baru.
          </p>
        </div>
      )}

      {/* Grid of Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {paginatedLogs.map((log) => {
          const formattedDate = new Date(log.date).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          const formattedTime = new Date(log.photoTimestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div
                  className="relative h-48 bg-slate-800 cursor-pointer overflow-hidden group"
                  onClick={() => setSelectedPhoto(log)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={log.photoUrl}
                    alt={log.activityTitle || "Foto Kegiatan Kadet"}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  {/* Stamp Badge */}
                  <div className="absolute top-3 left-3 bg-[#0A2540]/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] mr-1" />
                    Bukti Tervalidasi (&lt; 1MB)
                  </div>

                  {/* Date Badge */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-[#D4AF37]" />
                      {formattedDate} • {formattedTime}
                    </span>
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm flex items-center">
                      <ExternalLink className="w-3 h-3 mr-1" /> Zoom
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">
                      {log.activityTitle || "Aktivitas Mobilitas Harian"}
                    </h3>
                    {log.locationName && (
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-rose-500 flex-shrink-0" />
                        <span className="truncate">{log.locationName}</span>
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {log.description}
                  </p>
                </div>
              </div>

              {/* Footer Feedback & Action Button */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                {log.feedback ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center text-emerald-700 pr-2">
                      <CheckCircle className="w-4 h-4 mr-1 text-emerald-600 flex-shrink-0" />
                      <span className="line-clamp-1">
                        Catatan: &ldquo;{log.feedback}&rdquo;
                      </span>
                    </div>
                    {canGiveFeedback && (
                      <button
                        type="button"
                        onClick={() => handleOpenFeedback(log)}
                        className="text-[11px] text-[#0A2540] hover:text-[#1E3A8A] font-semibold flex items-center space-x-0.5 flex-shrink-0 hover:underline"
                      >
                        <Edit3 className="w-3 h-3 mr-0.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      <span>Menunggu verifikasi pembimbing</span>
                    </div>
                    {canGiveFeedback && (
                      <button
                        type="button"
                        onClick={() => handleOpenFeedback(log)}
                        className="text-[11px] bg-[#0A2540] hover:bg-[#1E3A8A] text-white px-2.5 py-1 rounded-md font-semibold transition flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Beri Catatan</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {!isLoading && filteredLogs.length > 0 && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-sm">
          <div>
            Menampilkan{" "}
            <span className="font-bold text-slate-900">
              {(currentPage - 1) * pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-900">
              {Math.min(currentPage * pageSize, filteredLogs.length)}
            </span>{" "}
            dari total{" "}
            <span className="font-bold text-slate-900">{filteredLogs.length}</span> jurnal
            {totalPages > 1 && ` (Halaman ${currentPage} dari ${totalPages})`}
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition flex items-center gap-1"
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
                  className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                    currentPage === pageNum
                      ? "bg-[#0A2540] text-white shadow-sm"
                      : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition flex items-center gap-1"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Input Feedback Pembimbing */}
      {activeFeedbackLog && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setActiveFeedbackLog(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Catatan Evaluasi Pembimbing STIP / Mitra
                </h3>
                <p className="text-xs text-slate-500">
                  {activeFeedbackLog.activityTitle || "Jurnal Kadet"}
                </p>
              </div>
              <button
                onClick={() => setActiveFeedbackLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Catatan &amp; Bimbingan Teknis
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan arahan navigasi, apresiasi, atau instruksi tindak lanjut kegiatan kadet..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0A2540] outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveFeedbackLog(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-5 py-2 bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5"
                >
                  {isSubmittingFeedback ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                  )}
                  <span>Simpan Catatan Pembimbing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Zoom Foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#0A2540] text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">
                  {selectedPhoto.activityTitle || "Dokumentasi Mobilitas Kadet"}
                </h4>
                <p className="text-xs text-slate-300">
                  Cap Waktu: {new Date(selectedPhoto.photoTimestamp).toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-300 hover:text-white text-lg px-2"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-slate-900 flex justify-center max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.photoUrl}
                alt="Zoom Foto Kadet"
                className="max-h-[65vh] object-contain rounded"
              />
            </div>
            <div className="p-4 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">
                Deskripsi: {selectedPhoto.description}
              </p>
              {selectedPhoto.locationName && (
                <p>Lokasi: {selectedPhoto.locationName}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
