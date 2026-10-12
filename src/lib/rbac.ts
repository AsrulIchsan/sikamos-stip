// =========================================================================
// SIKAMOS - Role-Based Access Control (RBAC) Logic & Helpers
// =========================================================================

import { Role, RoleType } from "@/types/role";

// Pengecekan apakah user memiliki role tertentu
export function hasRole(userRole: string | undefined | null, allowedRoles: (RoleType | string)[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

// Helpers spesifik hierarki
export function isSuperAdmin(role: string | undefined | null): boolean {
  return role === Role.SUPER_ADMIN;
}

export function isAdmin(role: string | undefined | null): boolean {
  return role === Role.ADMIN;
}

export function isManagement(role: string | undefined | null): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

export function isDosenStip(role: string | undefined | null): boolean {
  return role === Role.DOSEN_STIP;
}

export function isMitra(role: string | undefined | null): boolean {
  return role === Role.MITRA;
}

export function isValidator(role: string | undefined | null): boolean {
  return role === Role.DOSEN_STIP || role === Role.MITRA;
}

export function isCadet(role: string | undefined | null): boolean {
  return role === Role.KADET;
}

// Otorisasi Aksi Tertentu
export function canManageRoles(role: string | undefined | null): boolean {
  return role === Role.SUPER_ADMIN;
}

export function canEditMasterData(role: string | undefined | null): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

export function canApproveMitra(role: string | undefined | null): boolean {
  return role === Role.MITRA || role === Role.SUPER_ADMIN;
}

export function canApproveStip(role: string | undefined | null): boolean {
  return role === Role.DOSEN_STIP || role === Role.SUPER_ADMIN;
}

export function canSubmitDailyLog(role: string | undefined | null): boolean {
  return role === Role.KADET;
}

export function canGiveFeedback(role: string | undefined | null): boolean {
  return role === Role.DOSEN_STIP || role === Role.MITRA || role === Role.SUPER_ADMIN;
}

// Masking Informasi Sensitif (Contoh: Nomor Paspor & Visa)
// Hanya SUPER_ADMIN, ADMIN, dan KADET pemilik yang boleh melihat nomor asli.
// Mitra & pihak luar melihat versi masked (cth: B928****)
export function maskSensitiveInfo(
  value: string | null | undefined,
  viewerRole: string | undefined | null,
  isOwner = false
): string {
  if (!value) return "-";
  if (isManagement(viewerRole) || isOwner) {
    return value;
  }
  if (value.length <= 4) {
    return "****";
  }
  // Pertahankan 4 digit pertama, sisanya disamarkan
  const prefix = value.substring(0, 4);
  const maskedLength = Math.max(value.length - 4, 4);
  return `${prefix}${"*".repeat(maskedLength)}`;
}

