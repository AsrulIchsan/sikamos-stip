import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const [
      totalCadets,
      totalUniversities,
      totalCountries,
      pendingReports,
      verifiedImmigration,
      failedLoginsToday,
    ] = await Promise.all([
      prisma.kadetProfile.count(),
      prisma.university.count(),
      prisma.country.count(),
      prisma.finalReport.count({
        where: {
          status: {
            in: ["SUBMITTED", "APPROVED_BY_MITRA"],
          },
        },
      }),
      prisma.immigrationDoc.count({
        where: {
          status: "VERIFIED",
        },
      }),
      prisma.loginHistory.count({
        where: {
          status: "FAILED",
        },
      }),
    ]);

    // Prodi breakdown from KadetProfile
    const nautikaCount = await prisma.kadetProfile.count({
      where: { kelas: { contains: "Nautika" } },
    });
    const teknikaCount = await prisma.kadetProfile.count({
      where: { kelas: { contains: "Teknika" } },
    });
    const kalkCount = await prisma.kadetProfile.count({
      where: {
        OR: [
          { kelas: { contains: "KALK" } },
          { kelas: { contains: "K.A.L.K" } },
          { kelas: { contains: "Ketatalaksanaan" } },
        ],
      },
    });

    const calculatedTotal = nautikaCount + teknikaCount + kalkCount || totalCadets || 1;
    const prodiStats = [
      {
        name: "Nautika (Deck Officer)",
        count: nautikaCount,
        percent: `${Math.round((nautikaCount / calculatedTotal) * 100)}%`,
        color: "bg-[#0A2540]",
      },
      {
        name: "Teknika (Marine Engineer)",
        count: teknikaCount,
        percent: `${Math.round((teknikaCount / calculatedTotal) * 100)}%`,
        color: "bg-blue-600",
      },
      {
        name: "KALK (Port & Logistics)",
        count: kalkCount,
        percent: `${Math.round((kalkCount / calculatedTotal) * 100)}%`,
        color: "bg-[#D4AF37]",
      },
    ];

    // Country partners from University
    const universities = await prisma.university.findMany({
      include: {
        country: true,
        _count: {
          select: { kadetProfiles: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const countryFlagMap: Record<string, string> = {
      SE: "🇸🇪",
      JP: "🇯🇵",
      NL: "🇳🇱",
      SG: "🇸🇬",
      DE: "🇩🇪",
      ID: "🇮🇩",
    };

    const countryPartners = universities.map((u) => ({
      name: u.country.name,
      partner: u.name,
      count: u._count.kadetProfiles,
      flag: countryFlagMap[u.country.code.toUpperCase()] || "🌐",
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalCadets,
        totalUniversities,
        totalCountries,
        pendingReports,
        verifiedImmigration,
        failedLoginsToday,
      },
      prodiStats,
      countryPartners,
    });
  } catch (error: unknown) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil metrik statistik", error: String(error) },
      { status: 500 }
    );
  }
}
