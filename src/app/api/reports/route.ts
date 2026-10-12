import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kadetId = searchParams.get("kadetId");
    const status = searchParams.get("status");

    let targetKadetId: string | undefined = undefined;
    if (kadetId) {
      const profile = await prisma.kadetProfile.findFirst({
        where: {
          OR: [{ id: kadetId }, { userId: kadetId }, { nrp: kadetId }],
        },
      });
      targetKadetId = profile ? profile.id : kadetId;
    }

    const whereClause: { kadetId?: string; status?: any } = {};
    if (targetKadetId) whereClause.kadetId = targetKadetId;
    if (status) whereClause.status = status;

    const reports = await prisma.finalReport.findMany({
      where: whereClause,
      include: {
        kadet: {
          include: {
            user: { select: { name: true, email: true } },
            university: { include: { country: true } },
          },
        },
        mitraSigner: { select: { name: true, email: true } },
        stipSigner: { select: { name: true, email: true } },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error: unknown) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data laporan", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kadetId, title, summary, fileReportUrl, isSubmit } = body;

    if (!kadetId || !title || !summary) {
      return NextResponse.json(
        { success: false, message: "kadetId, title, dan summary wajib diisi" },
        { status: 400 }
      );
    }

    // Resolusi kadetId
    const profile = await prisma.kadetProfile.findFirst({
      where: {
        OR: [{ id: kadetId }, { userId: kadetId }, { nrp: kadetId }],
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profil kadet tidak ditemukan" },
        { status: 404 }
      );
    }

    const targetKadetId = profile.id;
    const reportStatus = isSubmit ? "SUBMITTED" : "DRAFT";

    const report = await prisma.finalReport.upsert({
      where: { kadetId: targetKadetId },
      update: {
        title,
        summary,
        fileReportUrl: fileReportUrl || undefined,
        status: reportStatus,
      },
      create: {
        kadetId: targetKadetId,
        title,
        summary,
        fileReportUrl: fileReportUrl || null,
        status: reportStatus,
      },
      include: {
        kadet: {
          include: {
            user: { select: { name: true, email: true } },
            university: { include: { country: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: isSubmit
        ? "Laporan akhir berhasil diajukan untuk proses pengesahan Mitra & STIP."
        : "Draft laporan akhir berhasil disimpan.",
      data: report,
    });
  } catch (error: unknown) {
    console.error("Error saving report:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan laporan akhir", error: String(error) },
      { status: 500 }
    );
  }
}

