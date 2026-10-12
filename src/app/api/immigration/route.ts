import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kadetIdParam = searchParams.get("kadetId");
    const nrp = searchParams.get("nrp");
    const userId = searchParams.get("userId");

    const statusFilter = searchParams.get("status");
    const searchFilter = searchParams.get("search");

    if (!kadetIdParam && !nrp && !userId) {
      const whereConditions: any[] = [];

      if (statusFilter && ["PENDING", "VERIFIED", "REJECTED"].includes(statusFilter)) {
        whereConditions.push({ status: statusFilter });
      }

      if (searchFilter && searchFilter.trim()) {
        const q = searchFilter.trim();
        whereConditions.push({
          OR: [
            { pasporNo: { contains: q } },
            { visaNo: { contains: q } },
            { insuranceNo: { contains: q } },
            { kadet: { nrp: { contains: q } } },
            { kadet: { user: { name: { contains: q } } } },
          ],
        });
      }

      const whereClause = whereConditions.length > 0 ? { AND: whereConditions } : undefined;

      const [docs, totalCount, pendingCount, verifiedCount, rejectedCount] = await Promise.all([
        prisma.immigrationDoc.findMany({
          where: whereClause,
          include: {
            kadet: {
              include: {
                user: { select: { id: true, name: true, email: true, username: true } },
                university: { include: { country: true } },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 100,
        }),
        prisma.immigrationDoc.count(),
        prisma.immigrationDoc.count({ where: { status: "PENDING" } }),
        prisma.immigrationDoc.count({ where: { status: "VERIFIED" } }),
        prisma.immigrationDoc.count({ where: { status: "REJECTED" } }),
      ]);

      return NextResponse.json({
        success: true,
        data: docs,
        stats: {
          total: totalCount,
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount,
        },
      });
    }

    // Cari profil kadet yang cocok
    const kadetProfile = await prisma.kadetProfile.findFirst({
      where: {
        OR: [
          ...(kadetIdParam ? [{ id: kadetIdParam }, { userId: kadetIdParam }, { nrp: kadetIdParam }] : []),
          ...(nrp ? [{ nrp }] : []),
          ...(userId ? [{ userId }] : []),
        ],
      },
    });

    if (!kadetProfile) {
      return NextResponse.json({ success: true, data: null });
    }

    const doc = await prisma.immigrationDoc.findUnique({
      where: { kadetId: kadetProfile.id },
      include: {
        kadet: {
          include: {
            user: { select: { name: true, email: true } },
            university: { include: { country: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: doc, kadet: kadetProfile });
  } catch (error: unknown) {
    console.error("Error fetching immigration doc:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil dokumen imigrasi", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inputKadetId = formData.get("kadetId") as string | null;
    const nrp = formData.get("nrp") as string | null;
    const userId = formData.get("userId") as string | null;

    if (!inputKadetId && !nrp && !userId) {
      return NextResponse.json(
        { success: false, message: "kadetId, nrp, atau userId wajib disertakan" },
        { status: 400 }
      );
    }

    // Resolusi ID kadetProfile
    const kadetProfile = await prisma.kadetProfile.findFirst({
      where: {
        OR: [
          ...(inputKadetId ? [{ id: inputKadetId }, { userId: inputKadetId }, { nrp: inputKadetId }] : []),
          ...(nrp ? [{ nrp }] : []),
          ...(userId ? [{ userId }] : []),
        ],
      },
    });

    if (!kadetProfile) {
      return NextResponse.json(
        { success: false, message: "Profil kadet tidak ditemukan" },
        { status: 404 }
      );
    }

    const kadetId = kadetProfile.id;
    const pasporNo = formData.get("pasporNo") as string | null;
    const ttl = formData.get("ttl") as string | null;
    const pasporExpiryStr = formData.get("pasporExpiry") as string | null;

    const visaNo = formData.get("visaNo") as string | null;
    const visaType = formData.get("visaType") as string | null;
    const visaExpiryStr = formData.get("visaExpiry") as string | null;

    const insuranceNo = formData.get("insuranceNo") as string | null;
    const insuranceProvider = formData.get("insuranceProvider") as string | null;
    const insuranceExpiryStr = formData.get("insuranceExpiry") as string | null;

    const notes = formData.get("notes") as string | null;

    const pasporFile = formData.get("pasporFile") as File | null;
    const visaFile = formData.get("visaFile") as File | null;
    const insuranceFile = formData.get("insuranceFile") as File | null;

    // Helper simpan file (Lokal public/uploads atau fallback Base64 data URI pada Vercel)
    const saveFile = async (file: File, prefix: string) => {
      return await saveUploadedFile(file, "immigration", `${prefix}-${kadetId}`);
    };

    let pasporFileUrl: string | undefined = undefined;
    if (pasporFile && pasporFile.size > 0) {
      pasporFileUrl = await saveFile(pasporFile, "paspor");
    }

    let visaFileUrl: string | undefined = undefined;
    if (visaFile && visaFile.size > 0) {
      visaFileUrl = await saveFile(visaFile, "visa");
    }

    let insuranceFileUrl: string | undefined = undefined;
    if (insuranceFile && insuranceFile.size > 0) {
      insuranceFileUrl = await saveFile(insuranceFile, "insurance");
    }

    const pasporExpiry = pasporExpiryStr ? new Date(pasporExpiryStr) : null;
    const visaExpiry = visaExpiryStr ? new Date(visaExpiryStr) : null;
    const insuranceExpiry = insuranceExpiryStr ? new Date(insuranceExpiryStr) : null;

    // Sinkronkan pasporNo ke KadetProfile jika diisi
    if (pasporNo) {
      await prisma.kadetProfile.update({
        where: { id: kadetId },
        data: { pasporNo: pasporNo.trim() },
      });
    }

    // Upsert Immigration Doc
    const doc = await prisma.immigrationDoc.upsert({
      where: { kadetId },
      update: {
        ...(pasporNo !== null && { pasporNo: pasporNo ? pasporNo.trim() : null }),
        ...(ttl !== null && { ttl: ttl ? ttl.trim() : null }),
        ...(pasporExpiryStr !== null && { pasporExpiry }),
        ...(visaNo !== null && { visaNo: visaNo ? visaNo.trim() : null }),
        ...(visaType !== null && { visaType: visaType ? visaType.trim() : null }),
        ...(visaExpiryStr !== null && { visaExpiry }),
        ...(insuranceNo !== null && { insuranceNo: insuranceNo ? insuranceNo.trim() : null }),
        ...(insuranceProvider !== null && { insuranceProvider: insuranceProvider ? insuranceProvider.trim() : null }),
        ...(insuranceExpiryStr !== null && { insuranceExpiry }),
        ...(pasporFileUrl && { pasporFileUrl }),
        ...(visaFileUrl && { visaFileUrl }),
        ...(insuranceFileUrl && { insuranceFileUrl }),
        ...(notes !== null && { notes: notes ? notes.trim() : null }),
        status: "PENDING", // Status reset to PENDING on cadet update
      },
      create: {
        kadetId,
        pasporNo: pasporNo ? pasporNo.trim() : null,
        ttl: ttl ? ttl.trim() : null,
        pasporExpiry,
        visaNo: visaNo ? visaNo.trim() : null,
        visaType: visaType ? visaType.trim() : null,
        visaExpiry,
        insuranceNo: insuranceNo ? insuranceNo.trim() : null,
        insuranceProvider: insuranceProvider ? insuranceProvider.trim() : null,
        insuranceExpiry,
        pasporFileUrl: pasporFileUrl || null,
        visaFileUrl: visaFileUrl || null,
        insuranceFileUrl: insuranceFileUrl || null,
        status: "PENDING",
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Dokumen imigrasi berhasil diperbarui dan diajukan ke BPSDM.",
      data: doc,
    });
  } catch (error: unknown) {
    console.error("Error saving immigration doc:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan dokumen imigrasi", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, kadetId, status, notes } = body;

    if (!id && !kadetId) {
      return NextResponse.json(
        { success: false, message: "ID dokumen atau kadetId wajib disertakan" },
        { status: 400 }
      );
    }

    const updated = await prisma.immigrationDoc.update({
      where: id ? { id } : { kadetId },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Status verifikasi dokumen imigrasi berhasil diubah menjadi ${status}`,
      data: updated,
    });
  } catch (error: unknown) {
    console.error("Error updating immigration status:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui status dokumen", error: String(error) },
      { status: 500 }
    );
  }
}

