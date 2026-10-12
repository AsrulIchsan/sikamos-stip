import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logId, feedback } = body;

    if (!logId || !feedback) {
      return NextResponse.json(
        { success: false, message: "logId dan feedback wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.dailyLog.update({
      where: { id: logId },
      data: {
        feedback: feedback.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Catatan evaluasi pembimbing berhasil disimpan ke jurnal harian kadet.",
      data: updated,
    });
  } catch (error: unknown) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan catatan evaluasi", error: String(error) },
      { status: 500 }
    );
  }
}

