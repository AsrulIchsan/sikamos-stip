"use client";

import React, { useState, useRef } from "react";
import {
  compressCadetPhoto,
  CompressionResult,
} from "@/lib/image-compressor";
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  MapPin,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface DailyLogFormProps {
  kadetId: string;
  kadetName?: string;
  nrp?: string;
  onSuccess?: () => void;
}

export default function DailyLogForm({
  kadetId,
  kadetName = "Kadet STIP",
  nrp = "NRP-1928374",
  onSuccess,
}: DailyLogFormProps) {
  // State form
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [activityTitle, setActivityTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // State kompresi gambar
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] =
    useState<CompressionResult | null>(null);
  const [compressError, setCompressError] = useState<string | null>(null);

  // State submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler Pemilihan & Kompresi Otomatis Foto
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCompressError("File harus berupa gambar (JPG, PNG, WebP).");
      return;
    }

    setCompressError(null);
    setIsCompressing(true);

    try {
      const watermarkLabel = `${kadetName} | NRP: ${nrp}`;
      const result = await compressCadetPhoto(file, {
        maxSizeMB: 0.8, // Target terjamin < 1MB
        maxWidthOrHeight: 1920,
        addTimestampWatermark: true,
        watermarkText: watermarkLabel,
      });

      // Validasi tegas: Pastikan ukuran < 1MB (1024 KB)
      if (result.compressedSizeKB > 1024) {
        throw new Error(
          `Ukuran file setelah kompresi (${(result.compressedSizeKB / 1024).toFixed(2)} MB) masih melebihi 1MB.`
        );
      }

      setCompressionResult(result);
    } catch (err: unknown) {
      console.error("Kompresi gagal:", err);
      setCompressError(
        err instanceof Error
          ? err.message
          : "Gagal memproses dan mengompres foto."
      );
    } finally {
      setIsCompressing(false);
    }
  };

  // Handler Deteksi GPS Otomatis
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        if (!locationName) {
          setLocationName(
            `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          );
        }
      },
      (err) => {
        console.warn("Gagal mendapatkan lokasi GPS:", err);
        alert("Tidak dapat mengakses GPS. Pastikan izin lokasi aktif.");
      }
    );
  };

  // Handler Submit Jurnal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!compressionResult) {
      setSubmitError("Wajib mengunggah foto kegiatan yang telah dikompresi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("kadetId", kadetId);
      formData.append("date", date);
      formData.append("activityTitle", activityTitle);
      formData.append("description", description);
      formData.append("locationName", locationName);
      formData.append("photoTimestamp", compressionResult.timestamp);
      formData.append("photo", compressionResult.file);

      if (latitude !== null) formData.append("latitude", latitude.toString());
      if (longitude !== null) formData.append("longitude", longitude.toString());

      const res = await fetch("/api/daily-logs", {
        method: "POST",
        body: formData,
      });

      const resJson = await res.json();

      if (!res.ok) {
        throw new Error(resJson.message || "Gagal menyimpan jurnal harian.");
      }

      setSubmitSuccess(true);
      // Reset form
      setActivityTitle("");
      setDescription("");
      setLocationName("");
      setCompressionResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan sistem."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Form */}
      <div className="bg-gradient-to-r from-[#0A2540] to-[#1E3A8A] text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <Camera className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Input Jurnal Mobilitas Harian
              </h2>
              <p className="text-xs text-slate-300">
                Modul 5: Monitoring Kegiatan Luar Negeri | STIP Indonesia
              </p>
            </div>
          </div>
          <span className="text-xs bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] font-semibold px-3 py-1 rounded-full">
            Fitur Kritis
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Notifikasi Status */}
        {submitSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Jurnal Berhasil Disimpan!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Foto bukti kegiatan telah dikompresi &lt; 1MB dan timestamp resmi telah diverifikasi oleh sistem.
              </p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Gagal Mengirim Jurnal</h4>
              <p className="text-xs text-rose-700 mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        {/* Baris 1: Tanggal & Judul */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              <Calendar className="w-3.5 h-3.5 inline mr-1 text-[#0A2540]" />
              Tanggal Kegiatan *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              <FileText className="w-3.5 h-3.5 inline mr-1 text-[#0A2540]" />
              Judul / Topik Aktivitas *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Simulator Bridge Watchkeeping / Workshop"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Baris 2: Lokasi & Geotag */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#0A2540]" />
              Lokasi / Fasilitas Kampus Mitra
            </label>
            <button
              type="button"
              onClick={handleDetectGPS}
              className="text-xs text-[#1E3A8A] hover:text-[#0A2540] font-medium flex items-center space-x-1 hover:underline"
            >
              <span>Deteksi GPS Otomatis</span>
            </button>
          </div>
          <input
            type="text"
            placeholder="Contoh: World Maritime University - Simulation Center, Malmo"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:border-transparent transition"
          />
          {latitude !== null && longitude !== null && (
            <p className="text-[11px] text-emerald-600 mt-1 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Koordinat GPS tercatat: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          )}
        </div>

        {/* Baris 3: Deskripsi Kegiatan */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Deskripsi Kegiatan Harian (Jurnal Naratif) *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Deskripsikan secara detail materi studi, latihan maritim, kegiatan akademik, dan kompetensi yang dipelajari hari ini..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540] focus:border-transparent transition leading-relaxed"
          />
        </div>

        {/* Baris 4: Fitur Kritis - Kompresi Foto & Cap Waktu */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 bg-slate-50 hover:bg-slate-50/80 transition">
          <div className="flex flex-col items-center justify-center text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment" // Dukung langsung kamera HP
              onChange={handlePhotoSelect}
              className="hidden"
              id="cadet-photo-upload"
            />

            {!compressionResult && !isCompressing && (
              <label
                htmlFor="cadet-photo-upload"
                className="cursor-pointer flex flex-col items-center space-y-2.5"
              >
                <div className="p-4 bg-white rounded-full shadow-sm border border-slate-200 text-[#0A2540] hover:scale-105 transition">
                  <Upload className="w-7 h-7 text-[#0A2540]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Klik untuk Ambil Foto Kamera / Unggah Berkas
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sistem otomatis menambahkan Watermark Waktu &amp; Kompresi &lt; 1MB
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                  <span>Dukungan JPG, PNG, WebP (Auto Full-HD Compression)</span>
                </div>
              </label>
            )}

            {/* Status saat sedang mengompres */}
            {isCompressing && (
              <div className="py-8 flex flex-col items-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#0A2540] animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800">
                    Sedang Memproses &amp; Mengompresi Foto...
                  </p>
                  <p className="text-xs text-slate-500">
                    Membubuhi cap waktu resmi STIP dan memastikan file &lt; 1MB
                  </p>
                </div>
              </div>
            )}

            {/* Error kompresi */}
            {compressError && (
              <div className="mt-3 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
                {compressError}
              </div>
            )}

            {/* Hasil Kompresi & Preview Foto */}
            {compressionResult && !isCompressing && (
              <div className="w-full space-y-4">
                {/* Preview Image dengan Stempel */}
                <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm max-h-80 bg-slate-900 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={compressionResult.previewUrl}
                    alt="Preview Jurnal Kadet"
                    className="max-h-80 object-contain w-full"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Kompresi Berhasil (&lt; 1MB)
                  </div>
                </div>

                {/* Indikator Metrik Kompresi */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Ukuran Awal</span>
                    <span className="text-sm font-bold text-slate-700">
                      {(compressionResult.originalSizeKB / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Ukuran Akhir</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {compressionResult.compressedSizeKB} KB
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Efisiensi</span>
                    <span className="text-sm font-bold text-[#1E3A8A]">
                      Hemat {compressionResult.reductionPercentage}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Cap Waktu</span>
                    <span className="text-xs font-semibold text-slate-700 flex items-center truncate">
                      <Clock className="w-3 h-3 mr-1 inline text-slate-400" />
                      {new Date(compressionResult.timestamp).toLocaleTimeString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Tombol Ganti Foto */}
                <div className="flex justify-end">
                  <label
                    htmlFor="cadet-photo-upload"
                    className="cursor-pointer text-xs font-medium text-slate-600 hover:text-[#0A2540] hover:underline"
                  >
                    Ganti Foto Lain
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tombol Simpan Form */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isCompressing || !compressionResult}
            className="w-full bg-[#0A2540] hover:bg-[#1E3A8A] text-white font-semibold py-3.5 px-6 rounded-xl transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Menyimpan Jurnal ke Server...</span>
              </>
            ) : (
              <>
                <span>Kirim Laporan Harian Terverifikasi</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            Data jurnal akan langsung dapat dipantau oleh Dosen Pembimbing STIP &amp; BPSDM.
          </p>
        </div>
      </form>
    </div>
  );
}
