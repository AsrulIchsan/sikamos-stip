import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/types/role";

export const dynamic = "force-dynamic";

// =========================================================================
// API: Manajemen User & Role (Khusus SUPER_ADMIN dengan Server-Side Enforcement)
// =========================================================================

// GET: Ambil daftar pengguna dengan filter, pencarian, dan metrik statistik
export async function GET(request: NextRequest) {
  try {
    // 1. Server-Side Session Enforcement
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Autentikasi diperlukan" },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Hanya SUPER_ADMIN yang memiliki otorisasi" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const prodi = searchParams.get("prodi") || "";
    const semester = searchParams.get("semester") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "25", 10));

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (status === "active") {
      where.isActive = true;
    } else if (status === "suspended") {
      where.isActive = false;
    }

    if (prodi || semester) {
      where.kadetProfile = where.kadetProfile || {};
      if (prodi) {
        where.kadetProfile.kelas = { contains: prodi };
      }
      if (semester) {
        where.kadetProfile.semester = parseInt(semester, 10);
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
        { kadetProfile: { nrp: { contains: search } } },
        { kadetProfile: { kelas: { contains: search } } },
      ];
    }

    const [total, users, roleCounts, activeCount, suspendedCount] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          image: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          kadetProfile: {
            select: {
              id: true,
              nrp: true,
              kelas: true,
              semester: true,
              pasporNo: true,
              fotoProfil: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
    ]);

    const stats = {
      SUPER_ADMIN: 0,
      ADMIN: 0,
      DOSEN_STIP: 0,
      MITRA: 0,
      KADET: 0,
      totalActive: activeCount,
      totalSuspended: suspendedCount,
    };

    roleCounts.forEach((r) => {
      if (r.role in stats) {
        (stats as any)[r.role] = r._count.id;
      }
    });

    return NextResponse.json({
      success: true,
      total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats,
      data: users,
    });
  } catch (error: unknown) {
    console.error("Error fetching users for admin:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar pengguna", error: String(error) },
      { status: 500 }
    );
  }
}

// POST: Tambah akun pengguna baru (Super Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Autentikasi diperlukan" },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Hanya SUPER_ADMIN yang dapat membuat akun baru" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, username, email, role, password, isActive, nrp, kelas, semester, pasporNo } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "Nama lengkap wajib diisi" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, message: "Email wajib diisi" }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ success: false, message: "Peran (role) wajib dipilih" }, { status: 400 });
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ success: false, message: "Kata sandi wajib diisi" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Periksa apakah email sudah digunakan
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: `Email "${cleanEmail}" sudah terdaftar di sistem` },
        { status: 400 }
      );
    }

    // Resolusi dan validasi username unik
    const cleanUsername = username
      ? username.trim().toLowerCase()
      : (role === Role.KADET && nrp ? nrp.trim() : cleanEmail.split("@")[0]);

    if (cleanUsername) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });
      if (existingUsername) {
        return NextResponse.json(
          { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh akun lain` },
          { status: 400 }
        );
      }
    }

    // Jika Role adalah KADET, wajib memiliki NRP
    if (role === Role.KADET) {
      if (!nrp || !nrp.trim()) {
        return NextResponse.json(
          { success: false, message: "NRP wajib diisi untuk pengguna dengan peran KADET" },
          { status: 400 }
        );
      }

      const cleanNrp = nrp.trim();
      const existingNrp = await prisma.kadetProfile.findUnique({
        where: { nrp: cleanNrp },
      });
      if (existingNrp) {
        return NextResponse.json(
          { success: false, message: `NRP "${cleanNrp}" sudah digunakan oleh kadet lain` },
          { status: 400 }
        );
      }
    }

    // Ambil universitas default jika kadet
    const defaultUni = await prisma.university.findFirst();

    // Buat Pengguna Baru
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername || null,
        email: cleanEmail,
        role,
        password: password.trim(),
        isActive: typeof isActive === "boolean" ? isActive : true,
        ...(role === Role.KADET && nrp && {
          kadetProfile: {
            create: {
              nrp: nrp.trim(),
              kelas: (kelas && kelas.trim().toUpperCase()) || "NAUTIKA 1 A",
              semester: semester ? parseInt(String(semester), 10) || 1 : 1,
              pasporNo: pasporNo ? pasporNo.trim() : null,
              universityId: defaultUni?.id || null,
              programName: "International Cadet Mobility Program 2026",
            },
          },
        }),
      },
      include: {
        kadetProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${newUser.name} (${newUser.role}) berhasil ditambahkan.`,
      data: newUser,
    });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat akun baru", error: String(error) },
      { status: 500 }
    );
  }
}

// PUT: Perbarui data akun pengguna (Edit Nama, Email, Role, Password, Status, NRP, Kelas, Semester)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Autentikasi diperlukan" },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Hanya SUPER_ADMIN yang dapat mengubah data akun" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, name, username, email, newRole, role, password, isActive, nrp, kelas, semester, pasporNo } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId wajib diisi" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { kadetProfile: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    const targetRole = newRole || role;
    const userUpdateData: any = {};

    if (name && name.trim()) userUpdateData.name = name.trim();

    if (username !== undefined) {
      const cleanUsername = username ? username.trim().toLowerCase() : null;
      if (cleanUsername && cleanUsername !== existingUser.username) {
        const usernameCheck = await prisma.user.findUnique({ where: { username: cleanUsername } });
        if (usernameCheck && usernameCheck.id !== userId) {
          return NextResponse.json(
            { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh akun lain` },
            { status: 400 }
          );
        }
      }
      userUpdateData.username = cleanUsername;
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== existingUser.email) {
        const emailCheck = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (emailCheck && emailCheck.id !== userId) {
          return NextResponse.json(
            { success: false, message: `Email "${cleanEmail}" sudah digunakan oleh akun lain` },
            { status: 400 }
          );
        }
        userUpdateData.email = cleanEmail;
      }
    }

    if (targetRole !== undefined) {
      userUpdateData.role = targetRole;
    }

    if (typeof isActive === "boolean") {
      userUpdateData.isActive = isActive;
    }

    if (password && password.trim()) {
      userUpdateData.password = password.trim();
    }

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
      include: {
        kadetProfile: true,
      },
    });

    // Update atau Buat KadetProfile jika user adalah KADET
    const currentEffectiveRole = targetRole || existingUser.role;
    if (currentEffectiveRole === Role.KADET) {
      const cleanNrp = nrp ? nrp.trim() : existingUser.kadetProfile?.nrp;

      if (cleanNrp) {
        // Cek duplikasi NRP pada akun lain
        const nrpCheck = await prisma.kadetProfile.findUnique({ where: { nrp: cleanNrp } });
        if (nrpCheck && nrpCheck.userId !== userId) {
          return NextResponse.json(
            { success: false, message: `NRP "${cleanNrp}" sudah digunakan oleh kadet lain` },
            { status: 400 }
          );
        }

        const kadetData: any = {
          nrp: cleanNrp,
          ...(kelas !== undefined && { kelas: kelas.trim().toUpperCase() }),
          ...(semester !== undefined && { semester: parseInt(String(semester), 10) || 1 }),
          ...(pasporNo !== undefined && { pasporNo: pasporNo ? pasporNo.trim() : null }),
        };

        if (existingUser.kadetProfile) {
          await prisma.kadetProfile.update({
            where: { id: existingUser.kadetProfile.id },
            data: kadetData,
          });
        } else {
          const defaultUni = await prisma.university.findFirst();
          await prisma.kadetProfile.create({
            data: {
              userId,
              nrp: cleanNrp,
              kelas: (kelas && kelas.trim().toUpperCase()) || "NAUTIKA 1 A",
              semester: semester ? parseInt(String(semester), 10) || 1 : 1,
              pasporNo: pasporNo ? pasporNo.trim() : null,
              universityId: defaultUni?.id || null,
              programName: "International Cadet Mobility Program 2026",
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Akun ${updatedUser.name || updatedUser.email} berhasil diperbarui.`,
      data: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui data akun", error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Hapus akun pengguna (Super Admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Autentikasi diperlukan" },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak: Hanya SUPER_ADMIN yang dapat menghapus akun" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId wajib disertakan" }, { status: 400 });
    }

    if (userId === (session.user as any).id) {
      return NextResponse.json(
        { success: false, message: "Anda tidak dapat menghapus akun Anda sendiri saat sedang login" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Akun pengguna berhasil dihapus dari sistem.",
    });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus pengguna", error: String(error) },
      { status: 500 }
    );
  }
}
