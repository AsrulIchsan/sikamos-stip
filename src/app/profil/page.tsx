"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  User,
  GraduationCap,
  Building2,
  Globe2,
  Mail,
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Calendar,
  FileText,
  Compass,
  FileCheck,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Camera,
  Check,
  BadgeAlert,
  AtSign,
} from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";

interface ProfileData {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: string;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  kadetProfile?: {
    id: string;
    nrp: string;
    kelas: string;
    semester: number;
    pasporNo: string | null;
    fotoProfil: string | null;
    programName: string | null;
    startDate: string | null;
    endDate: string | null;
    university?: {
      name: string;
      country?: {
        name: string;
        code: string;
      };
    } | null;
    dosenStip?: {
      name: string;
      email: string;
    } | null;
    mitra?: {
      name: string;
      email: string;
    } | null;
    immigrationDoc?: {
      status: string;
      pasporNo: string | null;
      visaNo: string | null;
    } | null;
    _count?: {
      dailyLogs: number;
    };
  } | null;
  _count?: {
    bimbinganStip?: number;
    bimbinganMitra?: number;
    loginHistories?: number;
  };
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const { user: rbacUser, isCadet, role, isManagement } = useRBAC();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form States (Editable)
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pasporNo, setPasporNo] = useState("");
  const [kelas, setKelas] = useState("");
  const [semester, setSemester] = useState<number>(1);
  const [programName, setProgramName] = useState("");

  // Password Update
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Avatar Upload & Preview
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Load Profil Pengguna
  const loadProfile = async () => {
    if (!session?.user) return;
    setIsLoading(true);
    try {
      const nrp = (session.user as any)?.nrp;
      const userId = (session.user as any)?.id || session.user.email;
      const res = await fetch(
        `/api/profile?userId=${encodeURIComponent(userId)}&nrp=${encodeURIComponent(nrp || "")}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        const u: ProfileData = json.data;
        setProfile(u);
        setName(u.name || "");
        setUsername(u.username || "");
        setEmail(u.email || "");
        if (u.kadetProfile) {
          setPasporNo(u.kadetProfile.pasporNo || "");
          setKelas(u.kadetProfile.kelas || "");
          setSemester(u.kadetProfile.semester || 1);
          setProgramName(u.kadetProfile.programName || "");
        }
        setAvatarPreview(u.image || u.kadetProfile?.fotoProfil || null);
      }
    } catch (err) {
      console.error("Gagal memuat profil:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [session]);

  // Handle Pilih File Avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setNotification({ type: "error", text: "Ukuran foto maksimal adalah 5MB." });
        return;
      }
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
    }
  };

  // Handle Simpan Profil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setNotification(null);

    // Validasi Password Baru
    if (newPassword) {
      if (newPassword.length < 5) {
        setNotification({ type: "error", text: "Kata sandi baru minimal terdiri dari 5 karakter." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setNotification({ type: "error", text: "Konfirmasi kata sandi baru tidak cocok." });
        return;
      }
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("userId", profile.id);
      if (profile.kadetProfile?.nrp) {
        formData.append("nrp", profile.kadetProfile.nrp);
      }

      formData.append("name", name.trim());
      formData.append("username", username.trim());
      formData.append("email", email.trim());

      if (newPassword) {
        formData.append("newPassword", newPassword.trim());
      }

      if (avatarFile) {
        formData.append("avatarFile", avatarFile);
      }

      if (profile.kadetProfile) {
        formData.append("pasporNo", pasporNo.trim());
        formData.append("kelas", kelas.trim());
        formData.append("semester", String(semester));
        formData.append("programName", programName.trim());
      }

      const res = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setNotification({
          type: "success",
          text: "Profil akun Anda berhasil diperbarui dan tersimpan di sistem!",
        });
        setNewPassword("");
        setConfirmPassword("");
        setAvatarFile(null);
        // Refresh data
        loadProfile();
        // Update session jika nama atau foto berubah
        if (updateSession) {
          updateSession();
        }
      } else {
        setNotification({
          type: "error",
          text: json.message || "Gagal memperbarui profil.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Terjadi kesalahan koneksi saat menyimpan profil.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cadetNrp = profile?.kadetProfile?.nrp || (session?.user as any)?.nrp;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner Sapaan & Identitas */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#0E355A] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-[#D4AF37]/30 px-3 py-1 rounded-full text-xs font-semibold text-[#D4AF37]">
              <User className="w-3.5 h-3.5" />
              <span>Manajemen Akun &amp; Identitas Pengguna</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Profil Saya
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola data pribadi, foto resmi, informasi mobilitas kadet, serta pembaruan kata sandi akun SIKAMOS STIP Indonesia.
            </p>
          </div>

          {/* Role & Status Badge */}
          <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center flex-shrink-0 min-w-[200px] shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block mb-1">
              Hak Akses Sistem
            </span>
            <span
              className={`inline-flex items-center justify-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                role === "SUPER_ADMIN"
                  ? "bg-purple-500/30 text-purple-200 border border-purple-400/50"
                  : role === "ADMIN"
                  ? "bg-blue-500/30 text-blue-200 border border-blue-400/50"
                  : role === "DOSEN_STIP"
                  ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/50"
                  : role === "MITRA"
                  ? "bg-amber-500/30 text-amber-200 border border-amber-400/50"
                  : "bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/50"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{role || "PENGGUNA"}</span>
            </span>
            <div className="mt-2 text-[11px] text-emerald-300 flex items-center justify-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Akun Aktif &amp; Terverifikasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifikasi Status */}
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
            <span className="font-medium">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#0A2540]" />
          <p className="text-sm font-semibold text-slate-600">Memuat rincian profil pengguna...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================== */}
          {/* KOLOM KIRI (4 Kolom): Kartu Identitas Resmi & Foto       */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* Kartu Foto Profil */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-center space-y-5">
              <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden border-4 border-[#D4AF37] shadow-md bg-slate-100 group flex items-center justify-center">
                {avatarPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarPreview}
                    alt={name || "Foto Profil"}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0A2540] flex items-center justify-center text-white font-extrabold text-3xl">
                    {name
                      ? name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                      : "ST"}
                  </div>
                )}

                {/* Overlay Upload Foto */}
                <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer">
                  <Camera className="w-7 h-7 text-[#D4AF37] mb-1" />
                  <span className="text-[11px] font-bold">Ganti Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2">
                  {name || "Pengguna SIKAMOS"}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">
                    <AtSign className="w-3 h-3 text-slate-500" />
                    <span>{username || (cadetNrp ? cadetNrp : email.split("@")[0])}</span>
                  </span>
                  {cadetNrp && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <span>{isCadet ? `NRP: ${cadetNrp}` : `NIP: ${cadetNrp}`}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono mt-2 flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{email}</span>
                </p>
                {profile?.kadetProfile?.kelas && (
                  <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    {profile.kadetProfile.kelas} &bull; Semester {profile.kadetProfile.semester}
                  </span>
                )}
              </div>

              {/* Tombol Upload File Alternatif */}
              <label className="inline-flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition cursor-pointer shadow-sm">
                <Upload className="w-4 h-4 text-[#0A2540]" />
                <span>Pilih Foto dari Perangkat</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>

              {avatarFile && (
                <p className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200">
                  Foto baru dipilih: {avatarFile.name}. Klik Simpan Perubahan di bawah untuk menerapkan.
                </p>
              )}

              {/* Rincian Singkat Akun */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-left text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isCadet ? "Username (ID):" : "NIP / Username:"}</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs flex items-center space-x-1">
                    <AtSign className="w-3 h-3 text-slate-400" />
                    <span>{username || (cadetNrp ? cadetNrp : email.split("@")[0])}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Alamat Email:</span>
                  <span className="font-mono font-medium text-slate-700 truncate max-w-[170px]" title={email}>
                    {email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ID Pengguna:</span>
                  <span className="font-mono font-medium text-slate-800 truncate max-w-[150px]">
                    {profile?.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status Akun:</span>
                  <span className="font-bold text-emerald-600">Aktif</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Terdaftar Sejak:</span>
                  <span className="font-medium text-slate-700">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigasi Cepat Terkait Role */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Akses Menu Terkait
              </h4>
              <div className="space-y-2">
                {isCadet && (
                  <>
                    <Link
                      href="/imigrasi"
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-100 text-xs font-semibold text-slate-700 hover:text-[#0A2540]"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Dokumen Imigrasi &amp; Paspor</span>
                      </span>
                      <span className="text-[10px] text-slate-400">&rarr;</span>
                    </Link>
                    <Link
                      href="/monitoring"
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-100 text-xs font-semibold text-slate-700 hover:text-[#0A2540]"
                    >
                      <span className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-emerald-600" />
                        <span>Jurnal Harian Mobilitas</span>
                      </span>
                      <span className="text-[10px] text-slate-400">&rarr;</span>
                    </Link>
                    <Link
                      href="/laporan-akhir"
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-100 text-xs font-semibold text-slate-700 hover:text-[#0A2540]"
                    >
                      <span className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-[#D4AF37]" />
                        <span>Laporan Akhir &amp; E-Sign</span>
                      </span>
                      <span className="text-[10px] text-slate-400">&rarr;</span>
                    </Link>
                  </>
                )}

                {isManagement && (
                  <>
                    <Link
                      href="/admin/users"
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-100 text-xs font-semibold text-slate-700 hover:text-[#0A2540]"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Manajemen Role &amp; Pengguna</span>
                      </span>
                      <span className="text-[10px] text-slate-400">&rarr;</span>
                    </Link>
                    <Link
                      href="/admin/login-history"
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-100 text-xs font-semibold text-slate-700 hover:text-[#0A2540]"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>Audit Log Riwayat Login</span>
                      </span>
                      <span className="text-[10px] text-slate-400">&rarr;</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* KOLOM KANAN (8 Kolom): Formulir Pembaruan Profil Editable */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seksi 1: Data Pribadi & Kontak */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Data Pribadi &amp; Kontak Akun
                    </h3>
                    <p className="text-xs text-slate-500">
                      Perbarui nama lengkap, alamat email resmi, serta identitas kontak Anda.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Capt. Budi Santoso / Kadet Andi"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Username (ID Login) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        {isCadet ? "Username / NRP Login" : "Nomor Induk Pegawai (NIP) / Username"}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={isCadet ? "Contoh: 21.11.1234" : "Contoh: 198503152010121001 / admin"}
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none font-mono"
                        />
                        <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {isCadet
                          ? "Gunakan NRP atau ID unik login Anda ke sistem SIKAMOS."
                          : "Nomor Induk Pegawai (NIP) atau username login ke sistem SIKAMOS."}
                      </p>
                    </div>

                    {/* Alamat Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Alamat Email Resmi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nama@stip.ac.id"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none font-mono"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Email kedinasan/pribadi untuk korespondensi resmi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Data Akademik & Mobilitas (Khusus Kadet) */}
              {profile?.kadetProfile && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
                  <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                    <div className="p-2.5 bg-amber-50 text-amber-700 rounded-2xl">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        Data Akademik &amp; Mobilitas Kadet STIP
                      </h3>
                      <p className="text-xs text-slate-500">
                        Informasi pleton/kelas, nomor paspor RI, dan program pertukaran maritim internasional.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* NRP (Read-only) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Nomor Registrasi Pokok (NRP)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={profile.kadetProfile.nrp}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-sm font-mono text-slate-600 font-bold cursor-not-allowed"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        NRP merupakan identitas unik tetap kadet STIP Indonesia.
                      </p>
                    </div>

                    {/* Nomor Paspor RI */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Nomor Paspor RI
                      </label>
                      <input
                        type="text"
                        value={pasporNo}
                        onChange={(e) => setPasporNo(e.target.value)}
                        placeholder="Contoh: B1234567 atau X987654"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Tersinkronisasi otomatis dengan Modul Dokumen Imigrasi.
                      </p>
                    </div>

                    {/* Kelas / Pleton */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Kelas / Jurusan / Pleton
                      </label>
                      <input
                        type="text"
                        value={kelas}
                        onChange={(e) => setKelas(e.target.value)}
                        placeholder="Contoh: TEKNIKA 3 D / NAUTIKA 2 A"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm uppercase focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none"
                      />
                    </div>

                    {/* Semester */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Semester Berjalan
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Program Mobilitas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Nama Program Mobilitas Studi
                    </label>
                    <input
                      type="text"
                      value={programName}
                      onChange={(e) => setProgramName(e.target.value)}
                      placeholder="Contoh: International Cadet Mobility Program 2026"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none"
                    />
                  </div>

                  {/* Informasi Universitas & Pembimbing (Read-only Card) */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#0A2540]" />
                      Institusi Mitra &amp; Dosen Pembimbing
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Universitas Mitra:</span>
                        <span className="font-bold text-slate-800">
                          {profile.kadetProfile.university?.name || "World Maritime University"}
                        </span>
                        {profile.kadetProfile.university?.country && (
                          <span className="text-slate-500 block text-[11px]">
                            {profile.kadetProfile.university.country.name}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Dosen Pembimbing STIP:</span>
                        <span className="font-bold text-slate-800">
                          {profile.kadetProfile.dosenStip?.name || "Capt. Sugeng Hartono, M.Mar."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seksi 3: Keamanan & Ganti Kata Sandi */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Keamanan &amp; Pembaruan Kata Sandi
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kosongkan bagian ini jika Anda tidak ingin mengubah kata sandi akun saat ini.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Kata Sandi Baru */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 5 karakter"
                        className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Kata Sandi Baru */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] focus:border-[#0A2540] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Simpan Perubahan */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#0A2540] to-[#1E3A8A] hover:from-[#0E355A] hover:to-[#2546A5] text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center space-x-2 text-sm shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                      <span>Menyimpan Pembaruan Profil...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 text-[#D4AF37]" />
                      <span>Simpan Perubahan Profil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

