"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Compass,
  FileCheck,
  Users,
  Globe2,
  FileText,
  ShieldAlert,
  Clock,
  Menu,
  X,
  LayoutDashboard,
  GraduationCap,
  Award,
} from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";
import AuthStatus from "@/components/auth/AuthStatus";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  badge?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const { role, isAuthenticated, isLoading } = useRBAC();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Whitelist Menu Berdasarkan Hierarki Peran
  const getNavItems = (): NavItem[] => {
    if (!isAuthenticated || !role) {
      return [];
    }

    switch (role) {
      case "SUPER_ADMIN":
        return [
          { label: "Dashboard", href: "/", icon: LayoutDashboard },
          { label: "Manajemen Role", href: "/admin/users", icon: ShieldAlert, badge: "RBAC" },
          { label: "Audit Log", href: "/admin/login-history", icon: Clock },
          { label: "Kadet", href: "/kadet", icon: Users },
          { label: "Mitra & Negara", href: "/mitra", icon: Globe2 },
          { label: "Imigrasi", href: "/imigrasi", icon: FileText },
          { label: "Jurnal", href: "/monitoring", icon: Compass },
          { label: "E-Sign", href: "/laporan-akhir", icon: FileCheck },
        ];

      case "ADMIN":
        return [
          { label: "Dashboard", href: "/", icon: LayoutDashboard },
          { label: "Database Kadet", href: "/kadet", icon: Users },
          { label: "Negara & Mitra", href: "/mitra", icon: Globe2 },
          { label: "Imigrasi", href: "/imigrasi", icon: FileText },
          { label: "Monitoring", href: "/monitoring", icon: Compass },
          { label: "Pengesahan", href: "/laporan-akhir", icon: FileCheck },
        ];

      case "DOSEN_STIP":
        return [
          { label: "Dashboard Dosen", href: "/", icon: LayoutDashboard },
          { label: "Kadet Bimbingan", href: "/kadet", icon: GraduationCap },
          { label: "Monitoring Jurnal", href: "/monitoring", icon: Compass },
          { label: "Validasi E-Sign", href: "/laporan-akhir", icon: FileCheck, badge: "Approval" },
        ];

      case "MITRA":
        return [
          { label: "Dashboard Mitra", href: "/", icon: LayoutDashboard },
          { label: "Kadet Host Univ", href: "/kadet", icon: GraduationCap },
          { label: "Verifikasi Jurnal", href: "/monitoring", icon: Compass },
          { label: "E-Sign Mitra", href: "/laporan-akhir", icon: Award, badge: "Approval" },
        ];

      case "KADET":
        return [
          { label: "Dashboard Saya", href: "/", icon: LayoutDashboard },
          { label: "Profil Saya", href: "/profil", icon: GraduationCap },
          { label: "Dokumen Imigrasi", href: "/imigrasi", icon: FileText },
          { label: "Jurnal Harian", href: "/monitoring", icon: Compass, badge: "Wajib" },
          { label: "Laporan Akhir", href: "/laporan-akhir", icon: FileCheck },
        ];

      default:
        return [{ label: "Dashboard", href: "/", icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  const isActiveRoute = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A2540] border-b border-white/10 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo Resmi STIP & Brand */}
          <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
            <div
              className="relative w-11 h-11 flex-shrink-0 group-hover:scale-105 transition duration-200"
              style={{ width: "44px", height: "44px", position: "relative" }}
            >
              <Image
                src="/images/stip-logo.png"
                alt="Logo Resmi STIP Indonesia"
                width={44}
                height={44}
                className="w-11 h-11 object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white">
                  SIKAMOS
                </span>
                <span className="text-[9px] bg-[#D4AF37]/25 border border-[#D4AF37] text-[#D4AF37] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  STIP INDONESIA
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium tracking-tight hidden sm:block">
                STIP International Kadet Mobility System
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Menu (Filtered by Whitelist) */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-medium overflow-x-auto py-1">
            {navItems.map((item) => {
              const active = isActiveRoute(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition ${
                    active
                      ? "bg-white/15 text-white font-bold border border-white/20 shadow-sm"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${active ? "text-[#D4AF37]" : "text-slate-300"}`} />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37] text-[#0A2540] font-black">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {isAuthenticated && <div className="h-5 w-px bg-white/20 mx-1.5 hidden lg:block" />}

            <AuthStatus />
          </nav>

          {/* Mobile Right Bar: AuthStatus & Hamburger */}
          <div className="flex items-center space-x-2 md:hidden">
            <AuthStatus />
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && isAuthenticated && (
          <div className="md:hidden py-3 border-t border-white/10 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => {
              const active = isActiveRoute(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                    active
                      ? "bg-white/20 text-white font-bold"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {Icon && <Icon className="w-4 h-4 text-[#D4AF37]" />}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#D4AF37] text-[#0A2540] font-black">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

