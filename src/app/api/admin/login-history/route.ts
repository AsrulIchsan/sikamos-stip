import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/types/role";

export const dynamic = "force-dynamic";

// =========================================================================
// API: Riwayat Login & Audit Trail (Khusus SUPER_ADMIN dengan Server Enforcement)
// =========================================================================

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
        { success: false, message: "Akses ditolak: Hanya SUPER_ADMIN yang memiliki akses Audit Log" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const role = searchParams.get("role") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "25", 10));

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (role) {
      where.roleAttempted = role;
    }

    // Filter Rentang Tanggal
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set ke akhir hari
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Filter Pencarian (Email/NRP, IP, Alasan Gagal, Nama User)
    if (search) {
      where.OR = [
        { emailAttempted: { contains: search } },
        { failReason: { contains: search } },
        { ipAddress: { contains: search } },
        { user: { name: { contains: search } } },
      ];
    }

    const [total, histories, successCount, failedCount] = await Promise.all([
      prisma.loginHistory.count({ where }),
      prisma.loginHistory.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.loginHistory.count({ where: { status: "SUCCESS" } }),
      prisma.loginHistory.count({ where: { status: "FAILED" } }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalLogins: successCount + failedCount,
        successCount,
        failedCount,
      },
      data: histories,
    });
  } catch (error: unknown) {
    console.error("Error fetching login history:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil riwayat login", error: String(error) },
      { status: 500 }
    );
  }
}
