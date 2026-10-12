// =========================================================================
// SIKAMOS - Role-Based Access Control (RBAC) Definitions
// =========================================================================

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN", // Admin utama pengelola sistem, role pengguna, dan audit log
  ADMIN = "ADMIN",             // Pengelola operasional mobilitas dan database kemitraan
  DOSEN_STIP = "DOSEN_STIP",   // Pembimbing internal untuk validasi dan pengesahan dokumen
  MITRA = "MITRA",             // Pembimbing kampus tujuan di luar negeri untuk verifikasi laporan
  KADET = "KADET",             // Mahasiswa pelaksana mobilitas internasional
}

export type RoleType = keyof typeof Role | "SUPER_ADMIN" | "ADMIN" | "DOSEN_STIP" | "MITRA" | "KADET";

export const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Admin (Sistem & Audit)",
  ADMIN: "Admin Operasional Mobilitas",
  DOSEN_STIP: "Dosen Pembimbing STIP",
  MITRA: "Pembimbing Mitra Luar Negeri",
  KADET: "Kadet Mahasiswa STIP",
};

export const ROLE_BADGE_CLASSES: Record<RoleType, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800 border-purple-300",
  ADMIN: "bg-blue-100 text-blue-800 border-blue-300",
  DOSEN_STIP: "bg-emerald-100 text-emerald-800 border-emerald-300",
  MITRA: "bg-amber-100 text-amber-800 border-amber-300",
  KADET: "bg-sky-100 text-sky-800 border-sky-300",
};

