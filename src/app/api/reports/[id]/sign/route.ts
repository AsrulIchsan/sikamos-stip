import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await request.json();
    const { signerRole, signatureCanvas, notes, action, signerId } = body;

    const existingReport = await prisma.finalReport.findUnique({
      where: { id: reportId },
      include: { kadet: true },
    });

    if (!existingReport) {
      return NextResponse.json(
        { success: false, message: "Laporan akhir tidak ditemukan" },
        { status: 404 }
      );
    }

    if (action === "REJECT") {
      const updated = await prisma.finalReport.update({
        where: { id: reportId },
        data: {
          status: "REJECTED",
          ...(signerRole === "MITRA"
            ? { mitraNotes: notes }
            : { stipNotes: notes }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Laporan dikembalikan ke Kadet untuk revisi.",
        data: updated,
      });
    }

    // Persetujuan Mitra (Tahap 1)
    if (signerRole === "MITRA") {
      if (!signatureCanvas) {
        return NextResponse.json(
          { success: false, message: "Tanda tangan digital Mitra wajib dibubuhkan." },
          { status: 400 }
        );
      }

      const updated = await prisma.finalReport.update({
        where: { id: reportId },
        data: {
          status: "APPROVED_BY_MITRA",
          mitraSignCanvas: signatureCanvas,
          mitraSignedAt: new Date(),
          mitraSignerId: signerId || undefined,
          mitraNotes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Laporan berhasil disetujui & ditandatangani oleh Pembimbing Mitra. Kini siap divalidasi oleh Dosen STIP Indonesia.",
        data: updated,
      });
    }

    // Persetujuan Dosen STIP (Tahap 2 - Final Learning Recognition)
    if (signerRole === "DOSEN_STIP") {
      if (existingReport.status !== "APPROVED_BY_MITRA") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Laporan belum disetujui oleh Pembimbing Mitra Luar Negeri. Menunggu persetujuan Mitra terlebih dahulu.",
          },
          { status: 400 }
        );
      }

      if (!signatureCanvas) {
        return NextResponse.json(
          { success: false, message: "Tanda tangan digital Dosen STIP wajib dibubuhkan." },
          { status: 400 }
        );
      }

      const updated = await prisma.finalReport.update({
        where: { id: reportId },
        data: {
          status: "APPROVED_BY_STIP",
          stipSignCanvas: signatureCanvas,
          stipSignedAt: new Date(),
          stipSignerId: signerId || undefined,
          stipNotes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Laporan mobilitas telah RESMI DISAHKAN oleh Dosen STIP Indonesia untuk Pengakuan Kredit (Learning Recognition).",
        data: updated,
      });
    }

    return NextResponse.json(
      { success: false, message: "Peran penandatangan tidak valid." },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Error signing report:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses tanda tangan elektronik", error: String(error) },
      { status: 500 }
    );
  }
}

