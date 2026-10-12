"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Globe2,
  Building2,
  Plus,
  Search,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Users,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  X,
  ChevronRight,
  ShieldAlert,
  FileCheck2,
  GraduationCap,
} from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";
import Authorize from "@/components/auth/Authorize";

interface Country {
  id: string;
  code: string;
  name: string;
}

interface UniversityKadet {
  id: string;
  nrp: string;
  kelas: string;
  semester: number;
  pasporNo: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    username?: string | null;
  };
  immigrationDoc?: {
    status: string;
  } | null;
}

interface University {
  id: string;
  name: string;
  countryId: string;
  address: string | null;
  website: string | null;
  country: {
    id: string;
    code: string;
    name: string;
  };
  kadetProfiles?: UniversityKadet[];
  _count?: {
    kadetProfiles: number;
  };
}

export default function MitraPage() {
  const { isManagement } = useRBAC();

  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Tambah Universitas
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUniName, setNewUniName] = useState("");
  const [newUniCountryId, setNewUniCountryId] = useState("");
  const [newUniAddress, setNewUniAddress] = useState("");
  const [newUniWebsite, setNewUniWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tampilan Lanjutan / Modal Detail & Edit Universitas
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<"detail" | "kadet">("detail");

  // Form Edit Universitas
  const [editUniName, setEditUniName] = useState("");
  const [editUniCountryId, setEditUniCountryId] = useState("");
  const [editUniAddress, setEditUniAddress] = useState("");
  const [editUniWebsite, setEditUniWebsite] = useState("");
  const [isSavingUni, setIsSavingUni] = useState(false);

  // Cadets Assignment in Selected Uni
  const [uniCadets, setUniCadets] = useState<UniversityKadet[]>([]);
  const [cadetSearchQuery, setCadetSearchQuery] = useState("");
  const [availableCadets, setAvailableCadets] = useState<any[]>([]);
  const [isSearchingCadets, setIsSearchingCadets] = useState(false);
  const [isAssigningCadet, setIsAssigningCadet] = useState(false);
  const [actionCadetId, setActionCadetId] = useState<string | null>(null);

  // Alert Feedback
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load Countries and Universities
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [countriesRes, unisRes] = await Promise.all([
        fetch("/api/partners/countries").then((r) => r.json()),
        fetch("/api/partners/universities").then((r) => r.json()),
      ]);

      if (countriesRes.success && Array.isArray(countriesRes.data)) {
        setCountries(countriesRes.data);
        if (countriesRes.data.length > 0 && !newUniCountryId) {
          setNewUniCountryId(countriesRes.data[0].id);
        }
      }

      if (unisRes.success && Array.isArray(unisRes.data)) {
        setUniversities(unisRes.data);
      }
    } catch (err) {
      console.error("Gagal memuat master mitra:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Buka Tampilan Lanjutan Saat Kartu Universitas Diklik
  const handleOpenUniDetail = async (uni: University) => {
    setSelectedUni(uni);
    setEditUniName(uni.name);
    setEditUniCountryId(uni.countryId);
    setEditUniAddress(uni.address || "");
    setEditUniWebsite(uni.website || "");
    setActiveTab("detail");
    setAvailableCadets([]);
    setCadetSearchQuery("");
    setIsLoadingDetail(true);

    try {
      const res = await fetch(`/api/partners/universities?id=${encodeURIComponent(uni.id)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedUni(json.data);
        setUniCadets(json.data.kadetProfiles || []);
      }
    } catch (err) {
      console.error("Gagal memuat detail universitas:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Simpan Perubahan Profil Universitas
  const handleSaveUniProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUni) return;
    setIsSavingUni(true);
    setAlertMsg(null);

    try {
      const res = await fetch("/api/partners/universities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUni.id,
          name: editUniName.trim(),
          countryId: editUniCountryId,
          address: editUniAddress.trim() || null,
          website: editUniWebsite.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAlertMsg({ type: "success", text: "Profil universitas berhasil diperbarui!" });
        // Update local selected & list
        setSelectedUni((prev) => (prev ? { ...prev, ...json.data } : null));
        loadData();
      } else {
        setAlertMsg({ type: "error", text: json.message || "Gagal memperbarui profil universitas." });
      }
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Terjadi kesalahan koneksi." });
    } finally {
      setIsSavingUni(false);
    }
  };

  // Hapus Universitas
  const handleDeleteUni = async () => {
    if (!selectedUni) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus universitas mitra "${selectedUni.name}"? Kadet yang terhubung akan dialihkan ke status belum ditentukan.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/partners/universities?id=${encodeURIComponent(selectedUni.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setAlertMsg({ type: "success", text: "Universitas mitra berhasil dihapus." });
        setSelectedUni(null);
        loadData();
      } else {
        setAlertMsg({ type: "error", text: json.message || "Gagal menghapus universitas." });
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: "Gagal menghapus universitas mitra." });
    }
  };

  // Cari Kadet untuk Ditugaskan
  const handleSearchCadets = async (query: string) => {
    setCadetSearchQuery(query);
    if (!query.trim()) {
      setAvailableCadets([]);
      return;
    }
    setIsSearchingCadets(true);
    try {
      const res = await fetch(`/api/partners/universities/cadets?search=${encodeURIComponent(query.trim())}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Filter out cadets already enrolled in this university
        const existingIds = new Set(uniCadets.map((c) => c.id));
        setAvailableCadets(json.data.filter((c: any) => !existingIds.has(c.id)));
      }
    } catch (err) {
      console.error("Gagal mencari kadet:", err);
    } finally {
      setIsSearchingCadets(false);
    }
  };

  // Tambah Kadet ke Universitas
  const handleAssignCadet = async (kadetId: string) => {
    if (!selectedUni) return;
    setIsAssigningCadet(true);
    setActionCadetId(kadetId);
    try {
      const res = await fetch("/api/partners/universities/cadets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: selectedUni.id,
          kadetId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAlertMsg({ type: "success", text: json.message || "Kadet berhasil ditambahkan ke universitas ini!" });
        // Refresh detail kadet
        const refreshed = await fetch(`/api/partners/universities?id=${encodeURIComponent(selectedUni.id)}`).then((r) =>
          r.json()
        );
        if (refreshed.success && refreshed.data) {
          setUniCadets(refreshed.data.kadetProfiles || []);
        }
        setAvailableCadets((prev) => prev.filter((c) => c.id !== kadetId));
        loadData();
      } else {
        setAlertMsg({ type: "error", text: json.message || "Gagal menambahkan kadet." });
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: "Terjadi gangguan saat menambahkan kadet." });
    } finally {
      setIsAssigningCadet(false);
      setActionCadetId(null);
    }
  };

  // Keluarkan / Hapus Kadet dari Universitas
  const handleRemoveCadet = async (kadetId: string, kadetName: string) => {
    if (!selectedUni) return;
    const confirmRemove = window.confirm(
      `Keluarkan kadet ${kadetName} dari penugasan mobilitas di universitas "${selectedUni.name}"?`
    );
    if (!confirmRemove) return;

    setActionCadetId(kadetId);
    try {
      const res = await fetch(`/api/partners/universities/cadets?kadetId=${encodeURIComponent(kadetId)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setAlertMsg({ type: "success", text: json.message || "Kadet berhasil dikeluarkan dari universitas." });
        setUniCadets((prev) => prev.filter((c) => c.id !== kadetId));
        loadData();
      } else {
        setAlertMsg({ type: "error", text: json.message || "Gagal mengeluarkan kadet." });
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: "Terjadi kesalahan saat mengeluarkan kadet." });
    } finally {
      setActionCadetId(null);
    }
  };

  // Tambah Universitas Baru (Modal Tambah)
  const handleAddUni = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlertMsg(null);

    try {
      const res = await fetch("/api/partners/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUniName.trim(),
          countryId: newUniCountryId,
          address: newUniAddress.trim() || null,
          website: newUniWebsite.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAlertMsg({ type: "success", text: "Universitas mitra baru berhasil ditambahkan!" });
        setShowAddModal(false);
        setNewUniName("");
        setNewUniAddress("");
        setNewUniWebsite("");
        loadData();
      } else {
        setAlertMsg({ type: "error", text: json.message || "Gagal menambahkan universitas." });
      }
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Terjadi kesalahan jaringan." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUnis = universities.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.country?.name && u.country.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#0E355A] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-[#D4AF37]/30 px-3 py-1 rounded-full text-xs font-semibold text-[#D4AF37] mb-2">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Modul 2 &amp; 3: Kemitraan Mobilitas Internasional STIP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Negara &amp; Universitas Mitra Maritim Dunia
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Kelola data universitas mitra, informasi kuota studi, serta penugasan kadet peserta program pertukaran dan mobilitas studi internasional.
          </p>
        </div>

        {/* Tombol Tambah Mitra: Khusus Super Admin & Admin */}
        <Authorize allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
          <button
            onClick={() => {
              setAlertMsg(null);
              setShowAddModal(true);
            }}
            className="bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0A2540] font-bold px-5 py-3 rounded-2xl transition flex items-center space-x-2 text-xs sm:text-sm shadow-lg hover:shadow-xl flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Universitas Mitra</span>
          </button>
        </Authorize>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-sm shadow-sm transition-all ${
            alertMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center space-x-3">
            {alertMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm md:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari universitas atau negara tujuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A2540]"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#0A2540]" />
            <strong className="text-[#0A2540]">{filteredUnis.length}</strong> Universitas Terdaftar
          </span>
        </div>

        <div className="bg-[#0A2540] text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-300 block">
              Total Negara Mitra
            </span>
            <span className="text-2xl font-black text-[#D4AF37]">{countries.length}</span>
          </div>
          <Globe2 className="w-8 h-8 text-[#D4AF37]/50" />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A2540]" />
          <p className="text-sm font-semibold">Memuat data universitas mitra...</p>
        </div>
      ) : filteredUnis.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm ? "Tidak Ada Universitas Ditemukan" : "Belum Ada Universitas Mitra"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? `Tidak ditemukan universitas mitra dengan kata kunci "${searchTerm}".`
              : "Belum ada universitas maritim mitra yang didaftarkan ke sistem."}
          </p>
        </div>
      ) : (
        /* Grid of Universities */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredUnis.map((uni) => {
            const cadetCount = uni._count?.kadetProfiles || 0;
            const countryName = uni.country?.name || "Luar Negeri";

            return (
              <div
                key={uni.id}
                onClick={() => handleOpenUniDetail(uni)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between cursor-pointer group hover:border-[#0A2540]/40 relative"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-blue-50 text-[#0A2540] group-hover:bg-[#0A2540] group-hover:text-white transition rounded-2xl border border-blue-100">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1" />
                      {cadetCount} Kadet Terdaftar
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-[#0A2540] transition">
                      {uni.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#1E3A8A] flex items-center mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-rose-500 flex-shrink-0" />
                      {countryName}
                    </p>
                    {uni.address && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {uni.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[#0A2540] font-bold flex items-center gap-1 group-hover:underline">
                    <span>Lihat Detail &amp; Kelola Kadet</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  {isManagement && (
                    <span className="text-[11px] font-semibold text-[#D4AF37] bg-[#0A2540] px-2 py-0.5 rounded-lg">
                      Editable Admin
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAMPILAN LANJUTAN: MODAL DETAIL, EDIT & KELOLA KADET     */}
      {/* ======================================================== */}
      {selectedUni && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl my-8 overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-[#0A2540] to-[#1E3A8A] p-6 text-white flex items-start justify-between flex-shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-bold bg-[#D4AF37] text-[#0A2540] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Detail Universitas &amp; Kadet Mobilitas
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-1 text-white">
                  {selectedUni.name}
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {selectedUni.country?.name} ({selectedUni.country?.code})
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedUni(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigasi Tab */}
            <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0 px-6">
              <button
                onClick={() => setActiveTab("detail")}
                className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                  activeTab === "detail"
                    ? "border-[#0A2540] text-[#0A2540] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Profil &amp; Edit Universitas</span>
              </button>
              <button
                onClick={() => setActiveTab("kadet")}
                className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
                  activeTab === "kadet"
                    ? "border-[#0A2540] text-[#0A2540] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Kadet Berpartisipasi ({uniCadets.length})</span>
              </button>
            </div>

            {/* Isi Konten Tab (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isLoadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-[#0A2540]" />
                  <p className="text-xs font-semibold">Memuat rincian universitas...</p>
                </div>
              ) : activeTab === "detail" ? (
                /* TAB 1: EDIT PROFIL UNIVERSITAS */
                <form onSubmit={handleSaveUniProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      Nama Resmi Universitas Mitra *
                    </label>
                    <input
                      type="text"
                      required
                      value={editUniName}
                      disabled={!isManagement}
                      onChange={(e) => setEditUniName(e.target.value)}
                      placeholder="Contoh: World Maritime University (WMU)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none disabled:bg-slate-100 disabled:text-slate-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      Negara Tujuan *
                    </label>
                    <select
                      value={editUniCountryId}
                      disabled={!isManagement}
                      onChange={(e) => setEditUniCountryId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none disabled:bg-slate-100 disabled:text-slate-500 font-semibold"
                    >
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      Alamat Kampus
                    </label>
                    <textarea
                      rows={2}
                      value={editUniAddress}
                      disabled={!isManagement}
                      onChange={(e) => setEditUniAddress(e.target.value)}
                      placeholder="Alamat lengkap kampus..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none disabled:bg-slate-100 disabled:text-slate-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                      Website Resmi Universitas
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={editUniWebsite}
                        disabled={!isManagement}
                        onChange={(e) => setEditUniWebsite(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      />
                      {editUniWebsite && (
                        <a
                          href={editUniWebsite}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0A2540] font-bold rounded-xl flex items-center gap-1 text-xs border border-slate-300 flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Tombol Simpan & Hapus Khusus Admin */}
                  {isManagement ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleDeleteUni}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus Universitas</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingUni}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#0A2540] hover:bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        {isSavingUni && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />}
                        <span>Simpan Perubahan Profil</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Hanya Administrator &amp; Super Admin yang berwenang memperbarui profil mitra.
                    </p>
                  )}
                </form>
              ) : (
                /* TAB 2: KELOLA KADET YANG BERPARTISIPASI */
                <div className="space-y-6">
                  {/* Form Pencarian & Tambah Kadet ke Universitas */}
                  {isManagement && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <UserPlus className="w-4 h-4 text-[#0A2540]" />
                          <span>Tambah Kadet ke Universitas Ini</span>
                        </label>
                        <span className="text-[11px] text-slate-500">Cari berdasarkan NRP atau Nama</span>
                      </div>

                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={cadetSearchQuery}
                          onChange={(e) => handleSearchCadets(e.target.value)}
                          placeholder="Ketik NRP atau Nama Kadet STIP..."
                          className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0A2540] bg-white"
                        />
                      </div>

                      {/* Hasil Pencarian Kadet */}
                      {isSearchingCadets ? (
                        <div className="py-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0A2540]" />
                          <span>Mencari kadet...</span>
                        </div>
                      ) : availableCadets.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-white">
                          {availableCadets.map((c) => (
                            <div
                              key={c.id}
                              className="p-2 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs"
                            >
                              <div>
                                <strong className="text-slate-800 block">{c.user?.name || "Kadet STIP"}</strong>
                                <span className="text-[11px] font-mono text-slate-500">
                                  NRP: {c.nrp} • {c.kelas}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={isAssigningCadet && actionCadetId === c.id}
                                onClick={() => handleAssignCadet(c.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm disabled:opacity-50"
                              >
                                {isAssigningCadet && actionCadetId === c.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Plus className="w-3 h-3" />
                                )}
                                <span>Tugaskan</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : cadetSearchQuery.trim() ? (
                        <p className="text-xs text-slate-500 italic text-center py-2">
                          Tidak ditemukan kadet lain yang cocok dengan kata kunci tersebut.
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Daftar Kadet Aktif di Universitas Ini */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center justify-between">
                      <span>Daftar Kadet Peserta Mobilitas ({uniCadets.length})</span>
                      <span className="text-slate-400 font-normal normal-case">
                        Terdaftar di {selectedUni.name}
                      </span>
                    </h4>

                    {uniCadets.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">
                          Belum ada kadet yang ditugaskan ke universitas ini.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Gunakan kotak pencarian di atas untuk menambahkan kadet ke mitra ini.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        {uniCadets.map((kadet) => {
                          const kName = kadet.user?.name || "Kadet STIP";
                          const docStatus = kadet.immigrationDoc?.status || "PENDING";

                          return (
                            <div
                              key={kadet.id}
                              className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/70 transition gap-3"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-xl bg-[#0A2540] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {kName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")}
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-800 text-xs sm:text-sm">{kName}</h5>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                    <span className="font-mono font-semibold text-blue-700">NRP: {kadet.nrp}</span>
                                    <span>•</span>
                                    <span>{kadet.kelas}</span>
                                    <span>•</span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                        docStatus === "VERIFIED"
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-amber-50 text-amber-700 border border-amber-200"
                                      }`}
                                    >
                                      Imigrasi: {docStatus}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {isManagement && (
                                <button
                                  type="button"
                                  disabled={actionCadetId === kadet.id}
                                  onClick={() => handleRemoveCadet(kadet.id, kName)}
                                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1 border border-rose-200 transition flex-shrink-0 disabled:opacity-50"
                                  title="Keluarkan kadet dari universitas ini"
                                >
                                  {actionCadetId === kadet.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <UserMinus className="w-3.5 h-3.5" />
                                  )}
                                  <span className="hidden sm:inline">Keluarkan</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedUni(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH UNIVERSITAS MITRA BARU                     */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-[#0A2540] rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Tambah Universitas Mitra Baru
                  </h3>
                  <p className="text-xs text-slate-500">Master data institusi maritim internasional</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUni} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Nama Universitas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Massachusetts Maritime Academy"
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Negara Tujuan *
                </label>
                <select
                  value={newUniCountryId}
                  onChange={(e) => setNewUniCountryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                >
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Alamat Kampus
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 101 Academy Dr, Buzzards Bay, MA"
                  value={newUniAddress}
                  onChange={(e) => setNewUniAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Website Kampus
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newUniWebsite}
                  onChange={(e) => setNewUniWebsite(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#1E3A8A] text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5 disabled:opacity-50 transition"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />}
                  <span>Simpan Universitas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
