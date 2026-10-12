"use client";

import React from "react";
import { useRBAC } from "@/hooks/useRBAC";
import ManagementDashboard from "@/components/dashboard/ManagementDashboard";
import ValidatorDashboard from "@/components/dashboard/ValidatorDashboard";
import CadetDashboard from "@/components/dashboard/CadetDashboard";
import { Loader2 } from "lucide-react";

export default function DashboardRouterPage() {
  const { role, user, isLoading } = useRBAC();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#0A2540] animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Memuat Sesi Pengguna...</span>
      </div>
    );
  }

  // 1. Tampilan Level Manajemen (SUPER_ADMIN & ADMIN)
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ManagementDashboard isSuperAdmin={role === "SUPER_ADMIN"} />
      </div>
    );
  }

  // 2. Tampilan Level Validator (DOSEN_STIP & MITRA)
  if (role === "DOSEN_STIP" || role === "MITRA") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ValidatorDashboard role={role} userName={user?.name} />
      </div>
    );
  }

  // 3. Tampilan Level Peserta (KADET STIP)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CadetDashboard
        userName={user?.name}
        nrp={(user as any)?.nrp}
        kelas={(user as any)?.kelas}
      />
    </div>
  );
}
