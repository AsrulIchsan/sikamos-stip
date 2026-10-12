"use client";

import { useSession } from "next-auth/react";
import { RoleType } from "@/types/role";
import {
  hasRole,
  isSuperAdmin,
  isAdmin,
  isManagement,
  isDosenStip,
  isMitra,
  isValidator,
  isCadet,
  canManageRoles,
  canEditMasterData,
  canApproveMitra,
  canApproveStip,
  canSubmitDailyLog,
  canGiveFeedback,
  maskSensitiveInfo,
} from "@/lib/rbac";

export function useRBAC() {
  const { data: session, status } = useSession();

  const role = (session?.user as any)?.role as RoleType | undefined;
  const user = session?.user;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return {
    user,
    role,
    status,
    isLoading,
    isAuthenticated,
    // Role check functions
    hasRole: (allowed: (RoleType | string)[]) => hasRole(role, allowed),
    isSuperAdmin: isSuperAdmin(role),
    isAdmin: isAdmin(role),
    isManagement: isManagement(role),
    isDosenStip: isDosenStip(role),
    isMitra: isMitra(role),
    isValidator: isValidator(role),
    isCadet: isCadet(role),
    // Permission check functions
    canManageRoles: canManageRoles(role),
    canEditMasterData: canEditMasterData(role),
    canApproveMitra: canApproveMitra(role),
    canApproveStip: canApproveStip(role),
    canSubmitDailyLog: canSubmitDailyLog(role),
    canGiveFeedback: canGiveFeedback(role),
    // Sensitive data masking helper
    maskInfo: (val: string | null | undefined, isOwner = false) =>
      maskSensitiveInfo(val, role, isOwner),
  };
}

