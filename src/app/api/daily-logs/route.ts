import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

// Batas ukuran maksimal file: 1 MB (1024 * 1024 bytes)
const MAX_FILE_SIZE_BYTES = 1024 * 1024;

/**
 * GET: Mengambil daftar jurnal harian (Daily Logs)
 * Query Params: ?kadetId=xxx&limit=10&page=1
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kadetId = searchParams.get("kadetId");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    let targetKadetId: string | undefined = undefined;
    if (kadetId) {
      const profile = await prisma.kadetProfile.findFirst({
        where: {
          OR: [{ id: kadetId }, { userId: kadetId }, { nrp: kadetId }],
        },
      });
      targetKadetId = profile ? profile.id : kadetId;
    }

    const whereClause: { kadetId?: string } = {};
    if (targetKadetId) {
      whereClause.kadetId = targetKadetId;
    }

    const [total, logs] = await Promise.all([
      prisma.dailyLog.count({ where: whereClause }),
      prisma.dailyLog.findMany({
        where: whereClause,
        include: {
          kadet: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
              university: {
                select: {
                  name: true,
                  country: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: logs,
    });
  } catch (error: unknown) {
    console.error("Error fetching daily logs:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data jurnal harian",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Menyimpan jurnal harian baru dengan foto tervalidasi & terkompresi
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const kadetId = formData.get("kadetId") as string;
    const dateStr = formData.get("date") as string;
    const activityTitle = (formData.get("activityTitle") as string) || "";
    const description = formData.get("description") as string;
    const locationName = (formData.get("locationName") as string) || "";
    const photoTimestampStr = formData.get("photoTimestamp") as string;
    const photoFile = formData.get("photo") as File | null;
    const latitudeStr = formData.get("latitude") as string | null;
    const longitudeStr = formData.get("longitude") as string | null;

    // 1. Validasi input wajib
    if (!kadetId || !dateStr || !description) {
      return NextResponse.json(
        {
          success: false,
          message: "Data tidak lengkap: kadetId, date, dan description wajib diisi.",
        },
        { status: 400 }
      );
    }

    // Resolusi kadetId jika dikirimkan sebagai userId atau nrp
    const profile = await prisma.kadetProfile.findFirst({
      where: {
        OR: [{ id: kadetId }, { userId: kadetId }, { nrp: kadetId }],
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profil kadet tidak ditemukan." },
        { status: 404 }
      );
    }

    const targetKadetId = profile.id;

    if (!photoFile) {
      return NextResponse.json(
        {
          success: false,
          message: "Foto kegiatan wajib diunggah sebagai bukti otentik kegiatan harian.",
        },
        { status: 400 }
      );
    }

    // 2. Validasi Kritis: Ukuran file WAJIB < 1MB
    if (photoFile.size >= MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: `Ukuran file melebihi batas 1MB (${(photoFile.size / 1024 / 1024).toFixed(2)} MB). Pastikan proses kompresi di frontend telah selesai.`,
        },
        { status: 400 }
      );
    }

    // 3. Simpan File (Lokal public/uploads atau fallback Base64 data URI pada Vercel)
    const photoUrl = await saveUploadedFile(photoFile, "daily-logs", `kadet-${kadetId}`);

    // 4. Parse waktu cap dan koordinat
    const activityDate = new Date(dateStr);
    const photoTimestamp = photoTimestampStr ? new Date(photoTimestampStr) : new Date();
    const latitude = latitudeStr ? parseFloat(latitudeStr) : null;
    const longitude = longitudeStr ? parseFloat(longitudeStr) : null;

    // 5. Simpan ke database melalui Prisma
    const newDailyLog = await prisma.dailyLog.create({
      data: {
        kadetId: targetKadetId,
        date: activityDate,
        activityTitle,
        description,
        photoUrl,
        photoTimestamp,
        locationName,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Laporan harian berhasil disimpan dengan bukti foto tervalidasi (< 1MB).",
        data: newDailyLog,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating daily log:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat menyimpan jurnal kegiatan",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
