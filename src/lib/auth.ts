import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { Role } from "@/types/role";

// Helper untuk mencatat Audit Trail Login History ke Database
async function recordLoginAudit(params: {
  userId?: string | null;
  emailAttempted: string;
  roleAttempted?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: "SUCCESS" | "FAILED";
  failReason?: string | null;
}) {
  try {
    await prisma.loginHistory.create({
      data: {
        userId: params.userId || null,
        emailAttempted: params.emailAttempted,
        roleAttempted: params.roleAttempted || null,
        ipAddress: params.ipAddress || "127.0.0.1",
        userAgent: params.userAgent || "Web Browser",
        status: params.status,
        failReason: params.failReason || null,
      },
    });
  } catch (error) {
    console.error("[SIKAMOS Audit Log Error] Gagal mencatat riwayat login:", error);
  }
}

// Ekstrak IP Address dari headers request
function getClientIp(req: any): string {
  if (!req?.headers) return "127.0.0.1";
  const headers = req.headers as Record<string, string | string[]>;
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers["x-real-ip"];
  if (typeof realIp === "string") {
    return realIp;
  }
  return "127.0.0.1";
}

// Ekstrak User Agent dari headers request
function getUserAgent(req: any): string {
  if (!req?.headers) return "Web Browser";
  const headers = req.headers as Record<string, string | string[]>;
  return (headers["user-agent"] as string) || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // Sesi berlaku 24 jam
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "SIKAMOS STIP Credentials",
      credentials: {
        email: { label: "NRP, NIP atau Email", type: "text", placeholder: "NRP / NIP / Email" },
        password: { label: "Kata Sandi", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const input = credentials.email.trim();
        const password = credentials.password.trim();
        const ipAddress = getClientIp(req);
        const userAgent = getUserAgent(req);

        // =========================================================================
        // 1. AUTENTIKASI: SUPER ADMIN UTAMA
        // =========================================================================
        if (
          input.toLowerCase() === "superadmin@stip.ac.id" ||
          input.toLowerCase() === "superadmin"
        ) {
          const superAdminUser = await prisma.user.findFirst({
            where: {
              OR: [{ email: "superadmin@stip.ac.id" }, { role: Role.SUPER_ADMIN }],
            },
          });

          // Verifikasi Password Super Admin (Default: superadmin123)
          const isValidPassword =
            password === "superadmin123" ||
            (superAdminUser?.password && password === superAdminUser.password);

          if (!isValidPassword) {
            await recordLoginAudit({
              userId: superAdminUser?.id,
              emailAttempted: input,
              roleAttempted: Role.SUPER_ADMIN,
              ipAddress,
              userAgent,
              status: "FAILED",
              failReason: "Invalid Password (Kata Sandi Salah)",
            });
            throw new Error("Kata sandi Super Admin salah.");
          }

          if (superAdminUser && !superAdminUser.isActive) {
            await recordLoginAudit({
              userId: superAdminUser.id,
              emailAttempted: input,
              roleAttempted: Role.SUPER_ADMIN,
              ipAddress,
              userAgent,
              status: "FAILED",
              failReason: "Account Suspended (Akun Dinonaktifkan)",
            });
            throw new Error("Akun Super Admin dinonaktifkan. Hubungi Pengelola Sistem.");
          }

          const userObj = {
            id: superAdminUser?.id || "super_admin_stip",
            name: superAdminUser?.name || "Super Admin Utama (BPSDM / STIP)",
            email: "superadmin@stip.ac.id",
            image: superAdminUser?.image || null,
            role: Role.SUPER_ADMIN,
            isActive: superAdminUser ? superAdminUser.isActive : true,
          };

          await recordLoginAudit({
            userId: userObj.id,
            emailAttempted: input,
            roleAttempted: Role.SUPER_ADMIN,
            ipAddress,
            userAgent,
            status: "SUCCESS",
          });

          return userObj;
        }

        // =========================================================================
        // 2. AUTENTIKASI: ADMIN OPERASIONAL MOBILITAS
        // =========================================================================
        if (
          input.toLowerCase() === "admin@stip.ac.id" ||
          input.toLowerCase() === "admin"
        ) {
          const adminUser = await prisma.user.findFirst({
            where: {
              OR: [{ email: "admin@stip.ac.id" }, { role: Role.ADMIN }],
            },
          });

          const isValidPassword =
            password === "admin123" ||
            password === "adminstip2026" ||
            (adminUser?.password && password === adminUser.password);

          if (!isValidPassword) {
            await recordLoginAudit({
              userId: adminUser?.id,
              emailAttempted: input,
              roleAttempted: Role.ADMIN,
              ipAddress,
              userAgent,
              status: "FAILED",
              failReason: "Invalid Password (Kata Sandi Salah)",
            });
            throw new Error("Kata sandi Admin salah.");
          }

          if (adminUser && !adminUser.isActive) {
            await recordLoginAudit({
              userId: adminUser.id,
              emailAttempted: input,
              roleAttempted: Role.ADMIN,
              ipAddress,
              userAgent,
              status: "FAILED",
              failReason: "Account Suspended (Akun Dinonaktifkan)",
            });
            throw new Error("Akun Admin dinonaktifkan.");
          }

          const userObj = {
            id: adminUser?.id || "admin_operasional",
            name: adminUser?.name || "Admin Operasional STIP Indonesia",
            email: "admin@stip.ac.id",
            image: adminUser?.image || null,
            role: Role.ADMIN,
            isActive: adminUser ? adminUser.isActive : true,
          };

          await recordLoginAudit({
            userId: userObj.id,
            emailAttempted: input,
            roleAttempted: Role.ADMIN,
            ipAddress,
            userAgent,
            status: "SUCCESS",
          });

          return userObj;
        }

        // =========================================================================
        // 3. AUTENTIKASI: DOSEN PEMBIMBING INTERNAL STIP
        // =========================================================================
        if (input.toLowerCase() === "dosen@stip.ac.id") {
          const dosenUser = await prisma.user.findUnique({
            where: { email: "dosen@stip.ac.id" },
          });

          const isValidPassword =
            password === "dosen123" ||
            password === "stip2026" ||
            (dosenUser?.password && password === dosenUser.password);

          if (!isValidPassword) {
            await recordLoginAudit({
              userId: dosenUser?.id,
              emailAttempted: input,
              roleAttempted: Role.DOSEN_STIP,
              ipAddress,
              userAgent,
              status: "FAILED",
              failReason: "Invalid Password (Kata Sandi Salah)",
            });
            throw new Error("Kata sandi Dosen salah.");
          }

          if (dosenUser && !dosenUser.isActive) {
            await recordLoginAudit({
              userId: dosenUser.id,
              emailAttempted: input,
              roleAttempted: Role.DOSEN_STIP,
              ipAddress,
              userAgent,
              status: "FAILED",
              failReason: "Account Suspended (Akun Dinonaktifkan)",
            });
            throw new Error("Akun Dosen dinonaktifkan.");
          }

          const userObj = {
            id: dosenUser?.id || "dosen_stip_01",
            name: dosenUser?.name || "Capt. Sugeng Hartono, M.Mar., M.Pd.",
            email: "dosen@stip.ac.id",
            image: dosenUser?.image || null,
            role: Role.DOSEN_STIP,
            isActive: dosenUser ? dosenUser.isActive : true,
          };

          await recordLoginAudit({
            userId: userObj.id,
            emailAttempted: input,
            roleAttempted: Role.DOSEN_STIP,
            ipAddress,
            userAgent,
            status: "SUCCESS",
          });

          return userObj;
        }

        // =========================================================================
        // 4. AUTENTIKASI: PEMBIMBING MITRA LUAR NEGERI
        // =========================================================================
        if (input.toLowerCase() === "mitra@wmu.se") {
          const mitraUser = await prisma.user.findUnique({
            where: { email: "mitra@wmu.se" },
          });

          const isValidPassword =
            password === "mitra123" ||
            password === "stip2026" ||
            (mitraUser?.password && password === mitraUser.password);

          if (!isValidPassword) {
            await recordLoginAudit({
              userId: mitraUser?.id,
              emailAttempted: input,
              roleAttempted: Role.MITRA,
              ipAddress,
              userAgent,
              status: "FAILED",
              failReason: "Invalid Password (Kata Sandi Salah)",
            });
            throw new Error("Kata sandi Mitra salah.");
          }

          if (mitraUser && !mitraUser.isActive) {
            await recordLoginAudit({
              userId: mitraUser.id,
              emailAttempted: input,
              roleAttempted: Role.MITRA,
              ipAddress,
              userAgent,
              status: "FAILED",
              failReason: "Account Suspended (Akun Dinonaktifkan)",
            });
            throw new Error("Akun Mitra dinonaktifkan.");
          }

          const userObj = {
            id: mitraUser?.id || "mitra_wmu_01",
            name: mitraUser?.name || "Prof. Henrik Nilsson, Ph.D. (WMU Sweden)",
            email: "mitra@wmu.se",
            image: mitraUser?.image || null,
            role: Role.MITRA,
            isActive: mitraUser ? mitraUser.isActive : true,
          };

          await recordLoginAudit({
            userId: userObj.id,
            emailAttempted: input,
            roleAttempted: Role.MITRA,
            ipAddress,
            userAgent,
            status: "SUCCESS",
          });

          return userObj;
        }

        // =========================================================================
        // 5. AUTENTIKASI: KADET STIP (NRP sebagai Akun & Kata Sandi)
        // =========================================================================
        const isNumericNrp = /^\d+$/.test(input);
        const emailSearch = isNumericNrp ? `${input}@stip.ac.id` : input.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: emailSearch },
              { username: input.toLowerCase() },
              { username: input },
              { kadetProfile: { nrp: input } },
              { id: `kadet_${input}` },
            ],
          },
          include: {
            kadetProfile: true,
          },
        });

        // Jika Akun Pengguna Tidak Ditemukan
        if (!user) {
          await recordLoginAudit({
            userId: null,
            emailAttempted: input,
            roleAttempted: null,
            ipAddress,
            userAgent,
            status: "FAILED",
            failReason: "User Not Found (Pengguna Tidak Terdaftar)",
          });
          throw new Error("Akun (NRP / NIP / Email) tidak terdaftar di sistem.");
        }

        // Cek Status Akun Aktif / Suspended
        if (!user.isActive) {
          await recordLoginAudit({
            userId: user.id,
            emailAttempted: input,
            roleAttempted: user.role,
            ipAddress,
            userAgent,
            status: "FAILED",
            failReason: "Account Suspended (Akun Dinonaktifkan)",
          });
          throw new Error("Akun Anda telah dinonaktifkan. Hubungi Administrator STIP.");
        }

        // Validasi Password Kadet (NRP, stored password, atau master emergency password)
        const kadetNrp = user.kadetProfile?.nrp || input;
        const isPasswordCorrect =
          password === kadetNrp ||
          password === user.password ||
          password === "stip2026";

        if (!isPasswordCorrect) {
          await recordLoginAudit({
            userId: user.id,
            emailAttempted: input,
            roleAttempted: user.role,
            ipAddress,
            userAgent,
            status: "FAILED",
            failReason: "Invalid Password (Kata Sandi Salah)",
          });
          throw new Error("Kata sandi salah. Gunakan NRP Anda untuk Kadet.");
        }

        // Login Berhasil
        const isCadetUser = (user.role || Role.KADET) === Role.KADET;
        const userObj = {
          id: user.id,
          name: user.name || (isCadetUser ? `Kadet ${kadetNrp}` : user.email.split("@")[0]),
          username: user.username || (isCadetUser ? kadetNrp : user.email.split("@")[0]),
          email: user.email,
          image: user.image || user.kadetProfile?.fotoProfil || null,
          role: user.role || Role.KADET,
          isActive: user.isActive,
          nrp: isCadetUser ? kadetNrp : null,
          nip: !isCadetUser ? (user.username || user.kadetProfile?.nrp || null) : null,
          kelas: user.kadetProfile?.kelas || "NAUTIKA",
        };

        await recordLoginAudit({
          userId: user.id,
          emailAttempted: input,
          roleAttempted: userObj.role,
          ipAddress,
          userAgent,
          status: "SUCCESS",
        });

        return userObj;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.isActive = (user as any).isActive ?? true;
        token.id = user.id;
        token.username = (user as any).username;
        token.nrp = (user as any).nrp;
        token.nip = (user as any).nip;
        token.kelas = (user as any).kelas;
        token.picture = (user as any).image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).isActive = token.isActive;
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).nrp = token.nrp;
        (session.user as any).nip = token.nip;
        (session.user as any).kelas = token.kelas;
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return url;
      return url;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "sikamos_stip_super_secret_jwt_key_2026",
};
