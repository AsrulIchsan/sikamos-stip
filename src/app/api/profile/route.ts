import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

// GET: Ambil detail profil pengguna (Kadet, Dosen, Mitra, Admin, Super Admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const nrp = searchParams.get("nrp");
    const email = searchParams.get("email");

    if (!userId && !nrp && !email) {
      return NextResponse.json(
        { success: false, message: "Parameter userId, nrp, atau email wajib disertakan" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(nrp ? [{ kadetProfile: { nrp } }, { email: `${nrp}@stip.ac.id` }, { id: `kadet_${nrp}` }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
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
          include: {
            university: {
              include: {
                country: true,
              },
            },
            dosenStip: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            mitra: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            immigrationDoc: {
              select: {
                id: true,
                status: true,
                pasporNo: true,
                pasporExpiry: true,
                visaNo: true,
                visaExpiry: true,
                insuranceNo: true,
                insuranceExpiry: true,
              },
            },
            _count: {
              select: {
                dailyLogs: true,
              },
            },
          },
        },
        _count: {
          select: {
            bimbinganStip: true,
            bimbinganMitra: true,
            loginHistories: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data profil", error: String(error) },
      { status: 500 }
    );
  }
}

// POST: Perbarui data profil pengguna & unggah foto avatar
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string | null;
    const nrp = formData.get("nrp") as string | null;

    if (!userId && !nrp) {
      return NextResponse.json(
        { success: false, message: "userId atau nrp wajib disertakan" },
        { status: 400 }
      );
    }

    // Cari user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(nrp ? [{ kadetProfile: { nrp } }, { email: `${nrp}@stip.ac.id` }, { id: `kadet_${nrp}` }] : []),
        ],
      },
      include: {
        kadetProfile: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    const name = formData.get("name") as string | null;
    const username = formData.get("username") as string | null;
    const email = formData.get("email") as string | null;
    const newPassword = formData.get("newPassword") as string | null;
    const avatarFile = formData.get("avatarFile") as File | null;

    // Fields khusus Kadet
    const pasporNo = formData.get("pasporNo") as string | null;
    const kelas = formData.get("kelas") as string | null;
    const semesterStr = formData.get("semester") as string | null;
    const programName = formData.get("programName") as string | null;

    let newImageUrl: string | undefined = undefined;

    // Proses unggah foto profil jika ada (Lokal public/uploads atau fallback Base64 data URI pada Vercel)
    if (avatarFile && avatarFile.size > 0) {
      newImageUrl = await saveUploadedFile(avatarFile, "avatars", `avatar-${existingUser.id}`);
    }

    // Update User Table
    const userUpdateData: any = {};
    if (name && name.trim()) userUpdateData.name = name.trim();

    // Validasi dan update username
    if (username !== null && username.trim()) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername !== existingUser.username) {
        const existingUsername = await prisma.user.findFirst({
          where: {
            username: cleanUsername,
            id: { not: existingUser.id },
          },
        });
        if (existingUsername) {
          return NextResponse.json(
            { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` },
            { status: 400 }
          );
        }
        userUpdateData.username = cleanUsername;
      }
    }

    // Validasi dan update email
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== existingUser.email) {
        const existingEmailUser = await prisma.user.findFirst({
          where: {
            email: cleanEmail,
            id: { not: existingUser.id },
          },
        });
        if (existingEmailUser) {
          return NextResponse.json(
            { success: false, message: `Alamat email "${cleanEmail}" sudah digunakan oleh akun lain.` },
            { status: 400 }
          );
        }
        userUpdateData.email = cleanEmail;
      }
    }

    if (newPassword && newPassword.trim()) userUpdateData.password = newPassword.trim();
    if (newImageUrl) userUpdateData.image = newImageUrl;

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: userUpdateData,
      include: {
        kadetProfile: {
          include: {
            university: {
              include: { country: true },
            },
          },
        },
      },
    });

    // Update KadetProfile Table jika user adalah Kadet
    if (existingUser.kadetProfile) {
      const kadetUpdateData: any = {};
      if (pasporNo !== null) kadetUpdateData.pasporNo = pasporNo.trim();
      if (kelas && kelas.trim()) kadetUpdateData.kelas = kelas.trim().toUpperCase();
      if (semesterStr) {
        const parsedSemester = parseInt(semesterStr, 10);
        if (!isNaN(parsedSemester)) kadetUpdateData.semester = parsedSemester;
      }
      if (programName !== null) kadetUpdateData.programName = programName.trim();
      if (newImageUrl) kadetUpdateData.fotoProfil = newImageUrl;

      if (Object.keys(kadetUpdateData).length > 0) {
        await prisma.kadetProfile.update({
          where: { id: existingUser.kadetProfile.id },
          data: kadetUpdateData,
        });

        // Sinkronkan nomor paspor ke ImmigrationDoc jika pasporNo diisi
        if (pasporNo && pasporNo.trim()) {
          await prisma.immigrationDoc.upsert({
            where: { kadetId: existingUser.kadetProfile.id },
            update: { pasporNo: pasporNo.trim() },
            create: {
              kadetId: existingUser.kadetProfile.id,
              pasporNo: pasporNo.trim(),
              status: "PENDING",
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profil dan informasi akun berhasil diperbarui.",
      data: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui profil pengguna", error: String(error) },
      { status: 500 }
    );
  }
}

