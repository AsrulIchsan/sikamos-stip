import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// =========================================================================
// SIKAMOS - Strict Security & Route Protection (Anti-Bocor RBAC)
// =========================================================================

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // 1. Validasi Status Suspended
    if (token && token.isActive === false) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "suspended");
      return NextResponse.redirect(loginUrl);
    }

    const role = (token?.role as string) || "KADET";

    // 2. Akses Rute Eksklusif SUPER_ADMIN:
    // /admin/roles, /admin/users, /admin/logs, /admin/login-history
    const isSuperAdminOnly =
      pathname.startsWith("/admin/users") ||
      pathname.startsWith("/admin/roles") ||
      pathname.startsWith("/admin/logs") ||
      pathname.startsWith("/admin/login-history");

    if (isSuperAdminOnly) {
      if (role !== "SUPER_ADMIN") {
        // Alihkan ke halaman 403 Forbidden
        return NextResponse.redirect(new URL("/403", req.url));
      }
      return NextResponse.next();
    }

    // 3. Akses Rute Admin Operasional (/admin/*):
    // Hanya untuk SUPER_ADMIN dan ADMIN
    if (pathname.startsWith("/admin")) {
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/403", req.url));
      }
      return NextResponse.next();
    }

    // 4. Akses Dashboard & Modul Operasional Lainnya
    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET || "sikamos_stip_super_secret_jwt_key_2026",
    callbacks: {
      authorized: ({ token }) => {
        // ZERO ROUTE LEAKAGE: Tanpa token autentikasi valid, langsung tolak dan lempar ke /login
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Matcher: Proteksi ketat rute Dashboard, Admin, dan seluruh Modul Fungsional SIKAMOS
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/kadet/:path*",
    "/mitra/:path*",
    "/imigrasi/:path*",
    "/monitoring/:path*",
    "/laporan-akhir/:path*",
    "/profil/:path*",
  ],
};
