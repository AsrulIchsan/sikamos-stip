"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import SignatureCanvas from "@/components/reports/SignatureCanvas";
import {
  FileText,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Building2,
  UserCheck,
  FileCheck,
  Check,
  ExternalLink,
  Printer,
  Loader2,
  Inbox,
} from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";
import Authorize from "@/components/auth/Authorize";

export default function LaporanAkhirPage() {
  const { role, user, isManagement, isCadet } = useRBAC();

  // Role aktif disinkronkan dengan sesi nyata pengguna
  const [activeRole, setActiveRole] = useState<"KADET" | "MITRA" | "DOSEN_STIP">("KADET");

  useEffect(() => {
    if (role === "MITRA") {
      setActiveRole("MITRA");
    } else if (role === "DOSEN_STIP") {
      setActiveRole("DOSEN_STIP");
    } else if (role === "KADET") {
      setActiveRole("KADET");
    }
  }, [role]);

  // Data Laporan State
  const [report, setReport] = useState<any>({
    id: null,
    title: "",
    summary: "",
    status: "DRAFT",
    mitraSignCanvas: null,
    mitraSignedAt: null,
    mitraNotes: "",
    stipSignCanvas: null,
    stipSignedAt: null,
    stipNotes: "",
  });

  const [inputTitle, setInputTitle] = useState("");
  const [inputSummary, setInputSummary] = useState("");
  const [capturedSign, setCapturedSign] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Workflow Steps Definition
  const steps = [
    { key: "DRAFT", label: "Draft Laporan", desc: "Disusun oleh Kadet" },
    { key: "SUBMITTED", label: "Diajukan", desc: "Menunggu Review Mitra" },
    { key: "APPROVED_BY_MITRA", label: "Disetujui Mitra", desc: "E-Sign Luar Negeri" },
    { key: "APPROVED_BY_STIP", label: "Disahkan STIP", desc: "Pengakuan Kredit Final" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "DRAFT":
        return 0;
      case "SUBMITTED":
        return 1;
      case "APPROVED_BY_MITRA":
        return 2;
      case "APPROVED_BY_STIP":
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(report.status);

  // Fetch Report dari Database API
  const loadReport = async () => {
    setIsLoading(true);
    try {
      let url = "/api/reports";
      if (activeRole === "KADET") {
        const identifier = (user as any)?.nrp || user?.id;
        if (identifier) url += `?kadetId=${encodeURIComponent(identifier)}`;
      } else if (activeRole === "MITRA") {
        url += `?status=SUBMITTED`;
      } else if (activeRole === "DOSEN_STIP") {
        url += `?status=APPROVED_BY_MITRA`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const r = json.data[0];
        setReport(r);
        setInputTitle(r.title || "");
        setInputSummary(r.summary || "");
      } else {
        setReport({
          id: null,
          title: "",
          summary: "",
          status: "DRAFT",
          mitraSignCanvas: null,
          mitraSignedAt: null,
          mitraNotes: "",
          stipSignCanvas: null,
          stipSignedAt: null,
          stipNotes: "",
        });
        setInputTitle("");
        setInputSummary("");
      }
    } catch (err) {
      console.error("Gagal memuat laporan akhir:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeRole, user]);

  // Handler Submit Kadet
  const handleKadetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kadetId: (user as any)?.nrp || user.id,
          title: inputTitle.trim(),
          summary: inputSummary.trim(),
          isSubmit: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setReport(json.data);
        setMessage({
          type: "success",
          text: "Laporan akhir berhasil diajukan untuk proses pengesahan Mitra & STIP.",
        });
      } else {
        setMessage({
          type: "error",
          text: json.message || "Gagal mengajukan laporan akhir.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan saat mengajukan laporan.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler E-Sign Mitra
  const handleMitraApproval = async () => {
    if (!capturedSign) {
      alert("Harap bubuhkan tanda tangan digital pada kanvas terlebih dahulu!");
      return;
    }
    if (!report?.id) {
      alert("Tidak ada laporan aktif untuk disahkan.");
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/reports/${report.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerRole: "MITRA",
          signatureCanvas: capturedSign,
          notes: reviewNotes,
          signerId: user?.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setReport(json.data);
        setCapturedSign(null);
        setReviewNotes("");
        setMessage({
          type: "success",
          text: "Persetujuan Pembimbing Mitra berhasil disimpan. Laporan kini diteruskan ke Dosen STIP Indonesia.",
        });
      } else {
        setMessage({
          type: "error",
          text: json.message || "Gagal menyimpan pengesahan Mitra.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan saat memproses tanda tangan.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler E-Sign Dosen STIP (Final Learning Recognition)
  const handleStipApproval = async () => {
    if (!capturedSign) {
      alert("Harap bubuhkan tanda tangan digital Dosen STIP terlebih dahulu!");
      return;
    }
    if (!report?.id) {
      alert("Tidak ada laporan aktif untuk disahkan.");
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/reports/${report.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerRole: "DOSEN_STIP",
          signatureCanvas: capturedSign,
          notes: reviewNotes,
          signerId: user?.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setReport(json.data);
        setCapturedSign(null);
        setReviewNotes("");
        setMessage({
          type: "success",
          text: "Laporan RESMI DISAHKAN oleh Dosen STIP Indonesia untuk Pengakuan Kredit (Learning Recognition)!",
        });
      } else {
        setMessage({
          type: "error",
          text: json.message || "Gagal menyimpan pengesahan Dosen STIP.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan saat memproses tanda tangan.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Kadet Data for Certificate View
  const certKadetName = report?.kadet?.user?.name || (isCadet ? user?.name : "Kadet STIP");
  const certKadetNrp = report?.kadet?.nrp || ((user as any)?.nrp || "-");
  const certKadetKelas = report?.kadet?.kelas || ((user as any)?.kelas || "D4 - Nautika");
  const certUniName = report?.kadet?.university?.name || "World Maritime University (WMU)";
  const certCountryName = report?.kadet?.university?.country?.name || "Swedia (Sweden)";
  const certMitraSignerName = report?.mitraSigner?.name || "Prof. Henrik Nilsson, Ph.D.";
  const certStipSignerName = report?.stipSigner?.name || "Capt. Sugeng Hartono, M.Mar., M.Pd.";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#102A45] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-[#D4AF37]">
            <Award className="w-3.5 h-3.5" />
            <span>Modul 6 &amp; 7: Evaluasi &amp; Validasi E-Sign Berjenjang</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pengesahan &amp; Tanda Tangan Elektronik
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Sistem pengesahan berjenjang dari Pembimbing Mitra Luar Negeri hingga Dosen STIP Indonesia untuk pengakuan kredit studi (<em>Learning Recognition</em>).
          </p>
        </div>

        {/* Role Switcher Demo (Hanya di-render untuk level SUPER_ADMIN / ADMIN) */}
        {isManagement && (
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 w-full md:w-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Pratinjau Sudut Pandang Peran (Admin View):
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveRole("KADET")}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeRole === "KADET"
                    ? "bg-[#D4AF37] text-[#0A2540] shadow"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                1. Kadet
              </button>
              <button
                onClick={() => setActiveRole("MITRA")}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeRole === "MITRA"
                    ? "bg-[#D4AF37] text-[#0A2540] shadow"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                2. Mitra (WMU)
              </button>
              <button
                onClick={() => setActiveRole("DOSEN_STIP")}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                  activeRole === "DOSEN_STIP"
                    ? "bg-[#D4AF37] text-[#0A2540] shadow"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                3. Dosen STIP
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Workflow Tracker Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
          Alur Status Validasi Dokumen:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx && report.status !== "DRAFT";
            const isCurrent = idx === currentStepIdx;

            return (
              <div
                key={step.key}
                className={`p-4 rounded-xl border transition ${
                  isCurrent
                    ? "border-[#0A2540] bg-blue-50/50 ring-2 ring-[#0A2540]/20"
                    : isCompleted
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-300 text-slate-600"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      isCurrent
                        ? "text-[#0A2540]"
                        : isCompleted
                        ? "text-emerald-800"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A2540]" />
          <p className="text-sm font-semibold">Memeriksa status laporan akhir...</p>
        </div>
      ) : (
        /* Form Action Berdasarkan Role yang Aktif */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Tindakan Role Aktif */}
          <div className="lg:col-span-5 space-y-6">
            {/* Mode 1: KADET */}
            {activeRole === "KADET" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-[#0A2540] text-white rounded-xl">
                    <FileText className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Panel Kadet: Susun Laporan Akhir
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kirim ringkasan komprehensif ke Pembimbing Luar Negeri
                    </p>
                  </div>
                </div>

                <form onSubmit={handleKadetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                      Judul Laporan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Laporan Akhir Mobilitas Studi IMO STCW di WMU..."
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                      Ringkasan Capaian Mobilitas *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Jelaskan ringkasan materi, modul simulator, praktik navigasi/mesin, dan hasil studi..."
                      value={inputSummary}
                      onChange={(e) => setInputSummary(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-[#0A2540] hover:bg-[#1E3A8A] text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-sm shadow-md disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    ) : (
                      <Send className="w-4 h-4 text-[#D4AF37]" />
                    )}
                    <span>Kirim Laporan untuk Persetujuan Mitra</span>
                  </button>
                </form>
              </div>
            )}

            {/* Mode 2: PEMBIMBING MITRA */}
            {activeRole === "MITRA" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-amber-600 text-white rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Panel Mitra: Universitas Maritim Luar Negeri
                    </h3>
                    <p className="text-xs text-slate-500">
                      Persetujuan &amp; Tanda Tangan Elektronik Pembimbing Luar Negeri
                    </p>
                  </div>
                </div>

                {!report.id || report.status === "DRAFT" ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700">Belum Ada Laporan Menunggu Persetujuan</h4>
                    <p className="text-[11px] text-slate-400">
                      Kadet belum mengajukan laporan akhir ke universitas mitra. Status saat ini masih DRAFT.
                    </p>
                  </div>
                ) : report.mitraSignCanvas ? (
                  <div className="p-4 bg-emerald-50 rounded-xl text-xs text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-600" />
                    Anda telah menandatangani laporan ini pada{" "}
                    {report.mitraSignedAt && new Date(report.mitraSignedAt).toLocaleString("id-ID")}.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                        Catatan Evaluasi Mitra (Opsional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: Excellent academic performance in bridge simulation..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#0A2540] outline-none"
                      />
                    </div>

                    <SignatureCanvas
                      signerTitle="Tanda Tangan Elektronik Pembimbing Mitra"
                      onSignatureCapture={(sign) => setCapturedSign(sign)}
                    />

                    <button
                      type="button"
                      onClick={handleMitraApproval}
                      disabled={isProcessing || !capturedSign}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 shadow-md"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                      <span>Sahkan Persetujuan Mitra (Tahap 1)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: DOSEN PEMBIMBING STIP INDONESIA */}
            {activeRole === "DOSEN_STIP" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-[#0A2540] text-white rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Panel Dosen STIP Indonesia
                    </h3>
                    <p className="text-xs text-slate-500">
                      Validasi Akhir &amp; E-Sign Konversi Nilai (Learning Recognition)
                    </p>
                  </div>
                </div>

                {!report.id || report.status === "DRAFT" ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700">Belum Ada Laporan Masuk</h4>
                    <p className="text-[11px] text-slate-400">
                      Belum ada laporan kadet yang diajukan untuk proses pengesahan.
                    </p>
                  </div>
                ) : report.status !== "APPROVED_BY_MITRA" && report.status !== "APPROVED_BY_STIP" ? (
                  <div className="p-4 bg-amber-50 rounded-xl text-xs text-amber-800 border border-amber-200 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Laporan belum dapat disahkan oleh STIP karena belum memperoleh persetujuan resmi dari Pembimbing Mitra (Status saat ini: {report.status}).
                    </span>
                  </div>
                ) : report.stipSignCanvas ? (
                  <div className="p-4 bg-emerald-50 rounded-xl text-xs text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-600" />
                    Laporan telah resmi disahkan oleh Dosen STIP Indonesia pada{" "}
                    {report.stipSignedAt && new Date(report.stipSignedAt).toLocaleString("id-ID")}.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                      <p className="font-bold">✓ Persetujuan Mitra Terverifikasi</p>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        Pembimbing Universitas Mitra telah menandatangani dokumen ini. Anda dapat membubuhkan E-Sign pengesahan STIP Indonesia.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">
                        Catatan Konversi Kredit / SK Penetapan
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: Disahkan untuk konversi 20 SKS Modul Nautika VIII..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#0A2540] outline-none"
                      />
                    </div>

                    <SignatureCanvas
                      signerTitle="Tanda Tangan Elektronik Dosen STIP Indonesia"
                      onSignatureCapture={(sign) => setCapturedSign(sign)}
                    />

                    <button
                      type="button"
                      onClick={handleStipApproval}
                      disabled={isProcessing || !capturedSign}
                      className="w-full bg-[#0A2540] hover:bg-[#1E3A8A] text-[#D4AF37] font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 shadow-md border border-[#D4AF37]/30"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>Sahkan Laporan Akhir (Learning Recognition)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kolom Kanan: Pratinjau Lembar Pengesahan Resmi (Official Certificate View) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between no-print">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <FileCheck className="w-4 h-4 mr-1.5 text-[#0A2540]" />
                Format Berita Acara / Lembar Pengesahan Resmi
              </h3>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-[#0A2540] hover:bg-[#1E3A8A] text-[#D4AF37] px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 border border-[#D4AF37]/40 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Unduh PDF</span>
              </button>
            </div>

            <div
              id="print-certificate-area"
              className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8 space-y-6 relative print:border-none print:shadow-none print:p-0"
            >
              {/* Watermark Status Laporan */}
              {report.status === "APPROVED_BY_STIP" && (
                <div className="absolute top-8 right-8 border-4 border-emerald-600/40 text-emerald-700 font-black text-xs sm:text-sm px-4 py-1.5 rounded-xl uppercase tracking-widest rotate-6 pointer-events-none">
                  RESMI DISAHKAN STIP
                </div>
              )}

              {/* Kop Dokumen Resmi STIP */}
              <div className="border-b-2 border-slate-800 pb-5 text-center relative">
                <div className="flex items-center justify-center space-x-4 mb-2">
                  <div
                    className="relative w-16 h-16 flex-shrink-0"
                    style={{ width: "64px", height: "64px", position: "relative" }}
                  >
                    <Image
                      src="/images/stip-logo.png"
                      alt="STIP Logo"
                      width={64}
                      height={64}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <h4 className="font-black text-sm sm:text-base text-slate-900 tracking-wider">
                      SEKOLAH TINGGI ILMU PELAYARAN INDONESIA
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-600">
                      BADAN PENGEMBANGAN SUMBER DAYA MANUSIA PERHUBUNGAN
                    </p>
                    <p className="text-[10px] text-slate-400">
                      PROGRAM MOBILITAS INTERNASIONAL KADET (SIKAMOS)
                    </p>
                  </div>
                </div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mt-3 underline">
                  LEMBAR PENGESAHAN LAPORAN MOBILITAS STUDI
                </h2>
              </div>

              {/* Biodata Kadet */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Nama Kadet</span>
                  <span className="col-span-2 font-bold text-slate-800">
                    : {certKadetName}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">NRP / Program Studi</span>
                  <span className="col-span-2 font-semibold text-slate-800">
                    : {certKadetNrp} / {certKadetKelas}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Universitas Tujuan</span>
                  <span className="col-span-2 font-semibold text-slate-800">
                    : {certUniName}, {certCountryName}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Judul Kegiatan</span>
                  <span className="col-span-2 font-bold text-slate-900">
                    : {report.title || "Belum ada judul laporan"}
                  </span>
                </div>
              </div>

              {/* Ringkasan Isi */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ringkasan Evaluasi Kegiatan:
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed text-justify bg-white p-3 rounded-lg border border-slate-100">
                  {report.summary || "Belum ada ringkasan laporan yang disubmit."}
                </p>
              </div>

              {/* Area 2 Tanda Tangan Elektronik Berdampingan */}
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-6 text-center text-xs">
                  {/* Kolom TTD 1: Pembimbing Mitra Luar Negeri */}
                  <div className="space-y-2 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <p className="font-semibold text-slate-700">
                      Pembimbing Mitra Universitas
                    </p>
                    <p className="text-[10px] text-slate-400">{certUniName}</p>

                    <div className="h-24 flex items-center justify-center bg-white rounded-lg border border-slate-200 overflow-hidden">
                      {report.mitraSignCanvas ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={report.mitraSignCanvas}
                          alt="TTD Mitra"
                          className="max-h-20 object-contain"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">
                          [Menunggu Tanda Tangan Mitra]
                        </span>
                      )}
                    </div>

                    {report.mitraSignedAt && (
                      <p className="text-[10px] text-emerald-600 font-mono">
                        ✓ E-Sign: {new Date(report.mitraSignedAt).toLocaleDateString("id-ID")}
                      </p>
                    )}
                    <p className="font-bold text-slate-800 text-[11px] pt-1">
                      {certMitraSignerName}
                    </p>
                  </div>

                  {/* Kolom TTD 2: Dosen Pembimbing STIP Indonesia */}
                  <div className="space-y-2 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <p className="font-semibold text-slate-700">
                      Dosen Pembimbing STIP Indonesia
                    </p>
                    <p className="text-[10px] text-slate-400">Sekolah Tinggi Ilmu Pelayaran</p>

                    <div className="h-24 flex items-center justify-center bg-white rounded-lg border border-slate-200 overflow-hidden">
                      {report.stipSignCanvas ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={report.stipSignCanvas}
                          alt="TTD STIP"
                          className="max-h-20 object-contain"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">
                          [Menunggu Pengesahan STIP]
                        </span>
                      )}
                    </div>

                    {report.stipSignedAt && (
                      <p className="text-[10px] text-emerald-600 font-mono">
                        ✓ E-Sign: {new Date(report.stipSignedAt).toLocaleDateString("id-ID")}
                      </p>
                    )}
                    <p className="font-bold text-slate-800 text-[11px] pt-1">
                      {certStipSignerName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
