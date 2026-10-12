import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// =========================================================================
// SIKAMOS - Strict Security & Route Protection (Zero Route Leakage RBAC)
// =========================================================================

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "sikamos_stip_super_secret_jwt_key_2026";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Ekstrak session token dengan prioritas secure cookie (Vercel Production HTTPS),
  // lalu unsecure cookie (Local Development HTTP)
  let token = await getToken({
    req,
    secret: JWT_SECRET,
    cookieName: "__Secure-next-auth.session-token",
  });

  if (!token) {
    token = await getToken({
      req,
      secret: JWT_SECRET,
      cookieName: "next-auth.session-token",
    });
  }

  if (!token) {
    token = await getToken({
      req,
      secret: JWT_SECRET,
    });
  }

  // 2. Jika tidak ada token valid, alihkan ke halaman login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Validasi status akun (Suspended / Non-aktif)
  if (token.isActive === false) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "suspended");
    return NextResponse.redirect(loginUrl);
  }

  const role = (token.role as string) || "KADET";

  // 4. Akses Rute Eksklusif SUPER_ADMIN:
  // /admin/users, /admin/roles, /admin/logs, /admin/login-history
  const isSuperAdminOnly =
    pathname.startsWith("/admin/users") ||
    pathname.startsWith("/admin/roles") ||
    pathname.startsWith("/admin/logs") ||
    pathname.startsWith("/admin/login-history");

  if (isSuperAdminOnly) {
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
    return NextResponse.next();
  }

  // 5. Akses Rute Admin Operasional (/admin/*):
  // Hanya untuk SUPER_ADMIN dan ADMIN
  if (pathname.startsWith("/admin")) {
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
    return NextResponse.next();
  }

  // 6. Rute lainnya diizinkan untuk sesi aktif
  return NextResponse.next();
}

// Proteksi ketat rute Dashboard, Admin, dan seluruh Modul Fungsional SIKAMOS
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
