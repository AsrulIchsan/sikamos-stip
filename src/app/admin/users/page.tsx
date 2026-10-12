"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  Search,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  GraduationCap,
  Building2,
  ArrowRight,
  Filter,
  UserX,
  ShieldCheck,
  Calendar,
  UserPlus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  AtSign,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Role, ROLE_BADGE_CLASSES } from "@/types/role";

interface UserItem {
  id: string;
  name: string | null;
  username?: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  kadetProfile?: {
    id?: string;
    nrp: string;
    kelas?: string;
    semester?: number;
    pasporNo?: string | null;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stats, setStats] = useState({
    SUPER_ADMIN: 1,
    ADMIN: 1,
    KADET: 0,
    DOSEN_STIP: 1,
    MITRA: 1,
    totalActive: 0,
    totalSuspended: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProdi, setSelectedProdi] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State Modal Tambah Akun
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    username: "",
    email: "",
    role: "KADET",
    password: "",
    isActive: true,
    nrp: "",
    kelas: "NAUTIKA 1 A",
    semester: 1,
    pasporNo: "",
  });

  // State Modal Edit Akun
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    userId: "",
    name: "",
    username: "",
    email: "",
    role: "KADET",
    password: "",
    isActive: true,
    nrp: "",
    kelas: "",
    semester: 1,
    pasporNo: "",
  });

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedRole) params.set("role", selectedRole);
      if (selectedStatus) params.set("status", selectedStatus);
      if (selectedProdi) params.set("prodi", selectedProdi);
      if (selectedSemester) params.set("semester", selectedSemester);
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.status === 403) {
        setErrorMessage("Akses ditolak: Modul ini hanya dapat diakses oleh SUPER_ADMIN.");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
        if (json.stats) setStats(json.stats);
        if (json.pagination) {
          setTotalUsers(json.pagination.total);
          setTotalPages(json.pagination.totalPages || 1);
        } else if (json.total !== undefined) {
          setTotalUsers(json.total);
          setTotalPages(Math.ceil(json.total / pageSize) || 1);
        }
      } else {
        setErrorMessage(json.message || "Gagal memuat pengguna.");
      }
    } catch (err) {
      console.error("Gagal load users:", err);
      setErrorMessage("Koneksi gagal saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset ke halaman 1 saat filter atau pageSize berubah
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedRole("");
    setSelectedStatus("");
    setSelectedProdi("");
    setSelectedSemester("");
    setCurrentPage(1);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedRole, selectedStatus, selectedProdi, selectedSemester, pageSize, currentPage]);

  // Handler Buka Modal Edit
  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditForm({
      userId: user.id,
      name: user.name || "",
      username: user.username || user.kadetProfile?.nrp || user.email.split("@")[0],
      email: user.email,
      role: user.role,
      password: "",
      isActive: user.isActive ?? true,
      nrp: user.kadetProfile?.nrp || "",
      kelas: user.kadetProfile?.kelas || "NAUTIKA 1 A",
      semester: user.kadetProfile?.semester || 1,
      pasporNo: user.kadetProfile?.pasporNo || "",
    });
    setShowPassword(false);
  };

  // Handler Submit Tambah Akun
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const json = await res.json();
      if (json.success) {
        setMessage(json.message || "Akun baru berhasil ditambahkan!");
        setIsAddModalOpen(false);
        setAddForm({
          name: "",
          username: "",
          email: "",
          role: "KADET",
          password: "",
          isActive: true,
          nrp: "",
          kelas: "NAUTIKA 1 A",
          semester: 1,
          pasporNo: "",
        });
        fetchUsers();
      } else {
        setErrorMessage(json.message || "Gagal menambahkan akun baru.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat membuat akun.");
    } finally {
      setIsAdding(false);
    }
  };

  // Handler Submit Edit Akun
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();
      if (json.success) {
        setMessage(json.message || "Akun berhasil diperbarui!");
        setEditingUser(null);
        fetchUsers();
      } else {
        setErrorMessage(json.message || "Gagal memperbarui akun.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memperbarui akun.");
    } finally {
      setIsEditing(false);
    }
  };

  // Handler Suspend / Activate Akun
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const confirmText = nextStatus
      ? "Apakah Anda yakin ingin MENGAKTIFKAN kembali akun ini?"
      : "Apakah Anda yakin ingin MENANGGUHKAN (SUSPEND) akun ini? Pengguna tidak akan bisa login ke sistem.";

    if (!confirm(confirmText)) return;

    setUpdatingId(userId);
    setMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage(json.message);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: nextStatus } : u))
        );
      } else {
        setErrorMessage(json.message || "Gagal memperbarui status akun");
      }
    } catch (err) {
      setErrorMessage("Terjadi kesalahan jaringan saat update status akun.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handler Hapus Akun
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin MENGHAPUS PERMANEN akun "${userName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setUpdatingId(userId);
    setMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setMessage(json.message || "Akun berhasil dihapus.");
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        setErrorMessage(json.message || "Gagal menghapus akun.");
      }
    } catch (err) {
      setErrorMessage("Terjadi kesalahan jaringan saat menghapus akun.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A2540] via-[#102A45] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-500/20 border border-purple-400/40 px-3 py-1 rounded-full text-xs font-bold text-purple-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>MODUL SUPER ADMIN UTAMA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            User &amp; Role Management (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Pengelolaan 5 tingkatan peran: <strong>SUPER_ADMIN</strong>, <strong>ADMIN</strong>, <strong>DOSEN_STIP</strong>, <strong>MITRA</strong>, dan <strong>KADET</strong> dengan kontrol status akun, username login, tambah akun, dan edit akun terpadu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tombol Tambah Akun Baru */}
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setShowPassword(false);
            }}
            className="bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0A2540] font-black px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 text-xs shadow-lg hover:shadow-xl"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Akun Baru</span>
          </button>

          {/* Tombol Audit Log */}
          <Link
            href="/admin/login-history"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 text-xs shadow-md"
          >
            <span>Audit Log (Login History)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-purple-600 uppercase block">
              Super Admin
            </span>
            <span className="text-2xl font-black text-purple-900 mt-1 block">
              {stats.SUPER_ADMIN || 0}
            </span>
            <span className="text-[10px] text-slate-500">Pengelola Sistem</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-purple-500/25" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase block">
              Admin Mobilitas
            </span>
            <span className="text-2xl font-black text-blue-900 mt-1 block">
              {stats.ADMIN || 0}
            </span>
            <span className="text-[10px] text-slate-500">BPSDM / STIP</span>
          </div>
          <Building2 className="w-8 h-8 text-blue-500/25" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase block">
              Dosen STIP
            </span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">
              {stats.DOSEN_STIP || 0}
            </span>
            <span className="text-[10px] text-slate-500">Pembimbing Internal</span>
          </div>
          <UserCheck className="w-8 h-8 text-emerald-500/25" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase block">
              Mitra Kampus
            </span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">
              {stats.MITRA || 0}
            </span>
            <span className="text-[10px] text-slate-500">Univ Luar Negeri</span>
          </div>
          <Users className="w-8 h-8 text-amber-500/25" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <span className="text-[11px] font-bold text-sky-600 uppercase block">
              Kadet STIP
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats.KADET || 0}
            </span>
            <span className="text-[10px] text-slate-500">Mahasiswa Aktif</span>
          </div>
          <GraduationCap className="w-8 h-8 text-sky-500/25" />
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs sm:text-sm shadow-sm">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs underline font-bold">
            Tutup
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs sm:text-sm shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs underline font-bold">
            Tutup
          </button>
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
              placeholder="Cari Nama, Username, NRP (Kadet), NIP (Staf), Kelas, atau Email..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
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
              <option value={25}>25 Data</option>
              <option value={50}>50 Data</option>
              <option value={100}>100 Data</option>
            </select>
          </div>
        </div>

        {/* Baris Filter Multi-Kategori */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>

            {/* Filter Role */}
            <select
              value={selectedRole}
              onChange={(e) => handleFilterChange(setSelectedRole, e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A2540] bg-white font-medium text-xs text-slate-700"
            >
              <option value="">Semua Peran (Role)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="DOSEN_STIP">DOSEN_STIP</option>
              <option value="MITRA">MITRA</option>
              <option value="KADET">KADET</option>
            </select>

            {/* Filter Status Akun */}
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A2540] bg-white font-medium text-xs text-slate-700"
            >
              <option value="">Semua Status Akun</option>
              <option value="active">Aktif Normal</option>
              <option value="suspended">Ditangguhkan (Suspended)</option>
            </select>

            {/* Filter Prodi / Jurusan */}
            <select
              value={selectedProdi}
              onChange={(e) => handleFilterChange(setSelectedProdi, e.target.value)}
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
              onChange={(e) => handleFilterChange(setSelectedSemester, e.target.value)}
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

            {(search || selectedRole || selectedStatus || selectedProdi || selectedSemester) && (
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
            onClick={fetchUsers}
            className="p-1.5 rounded-xl text-slate-500 hover:text-[#0A2540] hover:bg-slate-100 transition flex items-center gap-1 font-semibold text-xs"
            title="Segarkan Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Username (ID)</th>
                <th className="py-3.5 px-4">Alamat Email</th>
                <th className="py-3.5 px-4">NRP (Kadet) / NIP (Staf)</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Terdaftar</th>
                <th className="py-3.5 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0A2540]" />
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const nrp = u.kadetProfile?.nrp || "-";
                  const usernameDisplay = u.username || (u.kadetProfile?.nrp ? u.kadetProfile.nrp : u.email.split("@")[0]);
                  const isUpdating = updatingId === u.id;
                  const isActive = u.isActive ?? true;
                  const registeredDate = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";

                  return (
                    <tr key={u.id} className={`hover:bg-slate-50/70 transition ${!isActive ? "bg-rose-50/40" : ""}`}>
                      {/* Nama Lengkap */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-snug">{u.name || "-"}</div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4 font-mono">
                        <span className="inline-flex items-center space-x-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                          <AtSign className="w-3 h-3 text-slate-400" />
                          <span>{usernameDisplay}</span>
                        </span>
                      </td>

                      {/* Alamat Email */}
                      <td className="py-3 px-4 font-mono">
                        <a
                          href={`mailto:${u.email}`}
                          className="inline-flex items-center space-x-1.5 text-blue-700 hover:text-blue-900 hover:underline text-xs"
                          title={`Kirim email ke ${u.email}`}
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{u.email}</span>
                        </a>
                      </td>

                      {/* NRP (Kadet) / NIP (Staf) */}
                      <td className="py-3 px-4">
                        {u.role === "KADET" ? (
                          <>
                            <div className="font-mono font-bold text-slate-700">NRP: {nrp}</div>
                            {u.kadetProfile?.kelas && (
                              <div className="text-[10px] text-slate-400">
                                {u.kadetProfile.kelas} &bull; Sem. {u.kadetProfile.semester}
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <span className="font-mono font-bold text-slate-700">
                              NIP: {u.username || "-"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status Akun */}
                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      {/* Peran Aktif */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            ROLE_BADGE_CLASSES[u.role as keyof typeof ROLE_BADGE_CLASSES] ||
                            "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Tanggal Daftar */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{registeredDate}</span>
                        </div>
                      </td>

                      {/* Aksi Manajemen: Edit Akun, Suspend, Hapus */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Tombol Edit Akun */}
                          <button
                            disabled={isUpdating}
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition"
                            title="Edit Akun &amp; Informasi Pengguna"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Suspend / Aktifkan */}
                          <button
                            disabled={isUpdating || u.role === "SUPER_ADMIN"}
                            onClick={() => handleToggleStatus(u.id, isActive)}
                            className={`p-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center border disabled:opacity-40 disabled:cursor-not-allowed ${
                              isActive
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-200"
                            }`}
                            title={isActive ? "Tangguhkan Akun (Suspend)" : "Aktifkan Akun Kembali"}
                          >
                            {isActive ? <UserX className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>

                          {/* Tombol Hapus Akun */}
                          <button
                            disabled={isUpdating || u.role === "SUPER_ADMIN"}
                            onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
              {totalUsers === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-900">
              {Math.min(currentPage * pageSize, totalUsers)}
            </span>{" "}
            dari total{" "}
            <span className="font-bold text-slate-900">{totalUsers.toLocaleString("id-ID")}</span> akun
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

      {/* ======================================================== */}
      {/* MODAL: TAMBAH AKUN BARU                                  */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#0A2540] text-[#D4AF37] rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Tambah Akun Pengguna Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftarkan akun pengguna baru dengan peran otorisasi RBAC resmi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Nama Lengkap */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Capt. Ahmad Riyadi / Kadet Budi"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                />
              </div>

              {/* Username (Login ID) */}
              {/* Username / NIP */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  {addForm.role === "KADET" ? "Username (NRP Kadet)" : "Nomor Induk Pegawai (NIP) / Username"}
                  {addForm.role === "KADET" && <span className="text-slate-400 font-normal"> (Opsional)</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={addForm.role === "KADET" ? "Contoh: 568252524 (NRP)" : "Contoh: 198002022005011002 (NIP)"}
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#0A2540] outline-none"
                  />
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {addForm.role === "KADET"
                    ? "Digunakan untuk login. Otomatis menggunakan NRP jika diisi di bagian data akademik kadet."
                    : "Nomor Induk Pegawai (NIP) digunakan sebagai ID masuk/login staf/dosen/admin."}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Alamat Email Resmi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="pengguna@stip.ac.id"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#0A2540] outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Alamat surel resmi untuk komunikasi dan notifikasi sistem.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Peran / Role */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Peran (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#0A2540] outline-none bg-white"
                  >
                    <option value="KADET">KADET</option>
                    <option value="DOSEN_STIP">DOSEN_STIP</option>
                    <option value="MITRA">MITRA</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                {/* Status Akun */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Status Awal
                  </label>
                  <select
                    value={addForm.isActive ? "active" : "suspended"}
                    onChange={(e) => setAddForm({ ...addForm, isActive: e.target.value === "active" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#0A2540] outline-none bg-white"
                  >
                    <option value="active">Aktif Normal</option>
                    <option value="suspended">Ditangguhkan (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Kata Sandi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Kata Sandi Akun <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Kata sandi akun"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Seksi Khusus KADET */}
              {addForm.role === "KADET" && (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
                  <h4 className="font-bold text-[#0A2540] uppercase tracking-wide flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    Data Akademik Kadet STIP
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase">
                        NRP Kadet <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 568252524"
                        value={addForm.nrp}
                        onChange={(e) => setAddForm({ ...addForm, nrp: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#0A2540] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase">
                        Kelas / Jurusan
                      </label>
                      <input
                        type="text"
                        placeholder="NAUTIKA 1 A"
                        value={addForm.kelas}
                        onChange={(e) => setAddForm({ ...addForm, kelas: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs uppercase focus:ring-2 focus:ring-[#0A2540] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase">
                        Semester
                      </label>
                      <select
                        value={addForm.semester}
                        onChange={(e) => setAddForm({ ...addForm, semester: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#0A2540] outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase">
                        Nomor Paspor RI
                      </label>
                      <input
                        type="text"
                        placeholder="B1234567"
                        value={addForm.pasporNo}
                        onChange={(e) => setAddForm({ ...addForm, pasporNo: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase text-xs focus:ring-2 focus:ring-[#0A2540] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2.5 rounded-xl bg-[#0A2540] hover:bg-[#1E3A8A] text-white font-bold transition flex items-center space-x-1.5 shadow-md disabled:opacity-50"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Akun Baru</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT AKUN PENGGUNA                                */}
      {/* ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Edit Akun: {editingUser.name || editingUser.email}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID: <span className="font-mono">{editingUser.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Nama Lengkap */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                />
              </div>

              {/* Username / NIP (Login ID) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  {editForm.role === "KADET" ? "Username (NRP Kadet)" : "Nomor Induk Pegawai (NIP) / Username"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={editForm.role === "KADET" ? "Contoh: 568252524 (NRP)" : "Contoh: 198002022005011002 (NIP)"}
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#0A2540] outline-none"
                  />
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {editForm.role === "KADET"
                    ? "ID login kadet. Tersinkronisasi dengan Nomor Registrasi Pokok (NRP)."
                    : "Nomor Induk Pegawai (NIP) resmi untuk ID autentikasi pengguna."}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Alamat Email Resmi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#0A2540] outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Peran / Role */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Peran (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#0A2540] outline-none bg-white"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="DOSEN_STIP">DOSEN_STIP</option>
                    <option value="MITRA">MITRA</option>
                    <option value="KADET">KADET</option>
                  </select>
                </div>

                {/* Status Akun */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    Status Akun
                  </label>
                  <select
                    value={editForm.isActive ? "active" : "suspended"}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "active" })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#0A2540] outline-none bg-white"
                  >
                    <option value="active">Aktif Normal</option>
                    <option value="suspended">Ditangguhkan (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Reset Kata Sandi Baru */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Kata Sandi Baru / Reset Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#0A2540] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Isi kolom ini hanya jika Anda ingin mereset kata sandi akun pengguna.
                </p>
              </div>

              {/* Seksi Khusus KADET */}
              {(editForm.role === "KADET" || editingUser.kadetProfile) && (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
                  <h4 className="font-bold text-[#0A2540] uppercase tracking-wide flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    Data Akademik Kadet STIP
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase">
                        NRP Kadet
                      </label>
                      <input
                        type="text"
                        value={editForm.nrp}
                        onChange={(e) => setEditForm({ ...editForm, nrp: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#0A2540] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase">
                        Kelas / Jurusan
                      </label>
                      <input
                        type="text"
                        value={editForm.kelas}
                        onChange={(e) => setEditForm({ ...editForm, kelas: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs uppercase focus:ring-2 focus:ring-[#0A2540] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase">
                        Semester
                      </label>
                      <select
                        value={editForm.semester}
                        onChange={(e) => setEditForm({ ...editForm, semester: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-[#0A2540] outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase">
                        Nomor Paspor RI
                      </label>
                      <input
                        type="text"
                        value={editForm.pasporNo}
                        onChange={(e) => setEditForm({ ...editForm, pasporNo: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase text-xs focus:ring-2 focus:ring-[#0A2540] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition flex items-center space-x-1.5 shadow-md disabled:opacity-50"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan Akun</span>
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
