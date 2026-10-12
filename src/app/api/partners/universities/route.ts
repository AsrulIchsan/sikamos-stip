import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const countryId = searchParams.get("countryId");

    if (id) {
      const university = await prisma.university.findUnique({
        where: { id },
        include: {
          country: true,
          kadetProfiles: {
            include: {
              user: { select: { id: true, name: true, email: true, username: true } },
              immigrationDoc: true,
            },
            orderBy: { nrp: "asc" },
          },
          _count: {
            select: { kadetProfiles: true },
          },
        },
      });

      if (!university) {
        return NextResponse.json(
          { success: false, message: "Universitas tidak ditemukan" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: university });
    }

    const whereClause: { countryId?: string } = {};
    if (countryId) {
      whereClause.countryId = countryId;
    }

    const universities = await prisma.university.findMany({
      where: whereClause,
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

    return NextResponse.json({ success: true, data: universities });
  } catch (error: unknown) {
    console.error("Error fetching universities:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data universitas", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, countryId, address, website } = body;

    if (!name || !countryId) {
      return NextResponse.json(
        { success: false, message: "Nama universitas dan ID negara wajib diisi" },
        { status: 400 }
      );
    }

    const university = await prisma.university.create({
      data: {
        name: name.trim(),
        countryId,
        address: address?.trim() || null,
        website: website?.trim() || null,
      },
      include: {
        country: true,
      },
    });

    return NextResponse.json({ success: true, data: university }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating university:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan universitas", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, countryId, address, website } = body;

    if (!id || !name || !countryId) {
      return NextResponse.json(
        { success: false, message: "ID, Nama universitas, dan ID negara wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.university.update({
      where: { id },
      data: {
        name: name.trim(),
        countryId,
        address: address?.trim() || null,
        website: website?.trim() || null,
      },
      include: {
        country: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil universitas mitra berhasil diperbarui",
      data: updated,
    });
  } catch (error: unknown) {
    console.error("Error updating university:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui universitas", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID universitas wajib disertakan" },
        { status: 400 }
      );
    }

    // Unlink kadetProfiles terlebih dahulu agar tidak melanggar referential integrity
    await prisma.kadetProfile.updateMany({
      where: { universityId: id },
      data: { universityId: null },
    });

    await prisma.university.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Universitas mitra berhasil dihapus",
    });
  } catch (error: unknown) {
    console.error("Error deleting university:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus universitas", error: String(error) },
      { status: 500 }
    );
  }
}

