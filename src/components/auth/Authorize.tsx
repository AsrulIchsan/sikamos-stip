"use client";

import React from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { RoleType } from "@/types/role";

interface AuthorizeProps {
  allowedRoles: (RoleType | string)[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Komponen Otorisasi Tingkat Komponen (RBAC Client-Side).
 * Hanya me-render children ke DOM jika role pengguna ada dalam allowedRoles whitelist.
 * Jika tidak cocok, children dihilangkan sepenuhnya dari DOM (bukan cuma di-disable).
 */
export default function Authorize({
  allowedRoles,
  children,
  fallback = null,
}: AuthorizeProps) {
  const { role, isLoading, isAuthenticated } = useRBAC();

  if (isLoading || !isAuthenticated || !role) {
    return <>{fallback}</>;
  }

  const isAllowed = allowedRoles.includes(role);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

