import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET: Cari kadet untuk ditambahkan ke universitas mitra
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const kadets = await prisma.kadetProfile.findMany({
      where: search
        ? {
            OR: [
              { nrp: { contains: search } },
              { user: { name: { contains: search } } },
              { kelas: { contains: search } },
            ],
          }
        : undefined,
      take: 30,
      include: {
        user: { select: { id: true, name: true, email: true, username: true } },
        university: { select: { id: true, name: true } },
      },
      orderBy: { nrp: "asc" },
    });

    return NextResponse.json({ success: true, data: kadets });
  } catch (error: unknown) {
    console.error("Error searching cadets for university:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mencari kadet", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST: Tambahkan/Tugaskan kadet ke universitas mitra
 * Body: { universityId: string, kadetId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { universityId, kadetId } = body;

    if (!universityId || !kadetId) {
      return NextResponse.json(
        { success: false, message: "universityId dan kadetId wajib diisi" },
        { status: 400 }
      );
    }

    const updatedKadet = await prisma.kadetProfile.update({
      where: { id: kadetId },
      data: { universityId },
      include: {
        user: { select: { id: true, name: true, email: true, username: true } },
        university: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Kadet ${updatedKadet.user?.name || updatedKadet.nrp} berhasil didaftarkan ke universitas mitra!`,
      data: updatedKadet,
    });
  } catch (error: unknown) {
    console.error("Error assigning cadet to university:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menugaskan kadet ke universitas", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Hapus/Keluarkan kadet dari universitas mitra (set universityId: null)
 * Query Param: ?kadetId=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kadetId = searchParams.get("kadetId");

    if (!kadetId) {
      return NextResponse.json(
        { success: false, message: "kadetId wajib disertakan" },
        { status: 400 }
      );
    }

    const updatedKadet = await prisma.kadetProfile.update({
      where: { id: kadetId },
      data: { universityId: null },
      include: {
        user: { select: { id: true, name: true, email: true, username: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Kadet ${updatedKadet.user?.name || updatedKadet.nrp} berhasil dikeluarkan dari universitas mitra.`,
      data: updatedKadet,
    });
  } catch (error: unknown) {
    console.error("Error removing cadet from university:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengeluarkan kadet dari universitas", error: String(error) },
      { status: 500 }
    );
  }
}

