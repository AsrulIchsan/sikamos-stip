import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const prodi = searchParams.get("prodi");
    const semester = searchParams.get("semester");
    const hasPassport = searchParams.get("hasPassport");
    const immigrationStatus = searchParams.get("immigrationStatus");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limitParam = searchParams.get("limit");
    const limit = limitParam === "all" ? undefined : Math.max(1, parseInt(limitParam || "25", 10));

    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { nrp: { contains: search } },
          { kelas: { contains: search } },
          { user: { name: { contains: search } } },
          { pasporNo: { contains: search } },
        ],
      });
    }

    if (prodi) {
      andConditions.push({ kelas: { contains: prodi } });
    }

    if (semester) {
      andConditions.push({ semester: parseInt(semester, 10) });
    }

    if (hasPassport === "yes") {
      andConditions.push({
        AND: [
          { pasporNo: { not: null } },
          { pasporNo: { not: "" } },
        ],
      });
    } else if (hasPassport === "no") {
      andConditions.push({
        OR: [
          { pasporNo: null },
          { pasporNo: "" },
        ],
      });
    }

    if (immigrationStatus) {
      andConditions.push({
        immigrationDoc: { status: immigrationStatus },
      });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : undefined;

    const [total, cadets] = await Promise.all([
      prisma.kadetProfile.count({ where: whereClause }),
      prisma.kadetProfile.findMany({
        where: whereClause,
        take: limit,
        skip: limit ? (page - 1) * limit : undefined,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          university: {
            include: {
              country: true,
            },
          },
          immigrationDoc: true,
          dosenStip: {
            select: { id: true, name: true, email: true },
          },
          mitra: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { dailyLogs: true },
          },
        },
        orderBy: {
          nrp: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: cadets,
      pagination: {
        total,
        page,
        limit: limit || total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching cadets:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil database kadet", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      nrp,
      kelas,
      semester,
      pasporNo,
      fotoProfil,
      universityId,
      programName,
      startDate,
      endDate,
    } = body;

    if (!name || !email || !nrp || !kelas || !semester) {
      return NextResponse.json(
        { success: false, message: "Field wajib: Nama, Email, NRP, Kelas, dan Semester." },
        { status: 400 }
      );
    }

    // 1. Buat User KADET
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: password || "KadetSTIP2026!",
        role: "KADET",
        kadetProfile: {
          create: {
            nrp,
            kelas,
            semester: parseInt(semester, 10),
            pasporNo: pasporNo || null,
            fotoProfil: fotoProfil || null,
            universityId: universityId || null,
            programName: programName || "Mobilitas Internasional Kadet STIP",
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
          },
        },
      },
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

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating cadet:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mendaftarkan profil kadet", error: String(error) },
      { status: 500 }
    );
  }
}

