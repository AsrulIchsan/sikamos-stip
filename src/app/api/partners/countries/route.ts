import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      include: {
        universities: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ success: true, data: countries });
  } catch (error: unknown) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data negara", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, message: "Kode negara dan Nama negara wajib diisi" },
        { status: 400 }
      );
    }

    const country = await prisma.country.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
      },
    });

    return NextResponse.json({ success: true, data: country }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating country:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan negara", error: String(error) },
      { status: 500 }
    );
  }
}

