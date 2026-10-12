import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const jsonPath = path.join(__dirname, "..", "prisma", "seed-data.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("❌ File seed-data.json tidak ditemukan!");
    process.exit(1);
  }

  console.log("🚀 Memulai migrasi data ke Cloud Database (PostgreSQL / Neon / Supabase)...");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  // 1. Countries
  if (data.Country?.length) {
    console.log(`📌 Memasukkan ${data.Country.length} data Negara...`);
    for (const c of data.Country) {
      await prisma.country.upsert({
        where: { code: c.code },
        update: { name: c.name },
        create: {
          id: c.id,
          code: c.code,
          name: c.name,
        },
      });
    }
  }

  // 2. Universities
  if (data.University?.length) {
    console.log(`📌 Memasukkan ${data.University.length} data Universitas Mitra...`);
    for (const u of data.University) {
      await prisma.university.upsert({
        where: { id: u.id },
        update: {
          name: u.name,
          address: u.address,
          website: u.website,
          countryId: u.countryId,
        },
        create: {
          id: u.id,
          name: u.name,
          address: u.address,
          website: u.website,
          countryId: u.countryId,
        },
      });
    }
  }

  // 3. Users (Chunking for batch insert)
  if (data.User?.length) {
    console.log(`📌 Memproses ${data.User.length} Akun Pengguna (Super Admin, Admin, Dosen, Mitra, & Kadet)...`);
    const chunkSize = 200;
    for (let i = 0; i < data.User.length; i += chunkSize) {
      const chunk = data.User.slice(i, i + chunkSize);
      for (const u of chunk) {
        await prisma.user.upsert({
          where: { email: u.email },
          update: {
            name: u.name,
            username: u.username,
            role: u.role,
            isActive: Boolean(u.isActive),
          },
          create: {
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            password: u.password,
            image: u.image,
            role: u.role,
            isActive: Boolean(u.isActive),
          },
        });
      }
      console.log(`   ✓ Tersimpan ${Math.min(i + chunkSize, data.User.length)} / ${data.User.length} pengguna`);
    }
  }

  // 4. Kadet Profiles
  if (data.KadetProfile?.length) {
    console.log(`📌 Memproses ${data.KadetProfile.length} Profil Kadet...`);
    const chunkSize = 200;
    for (let i = 0; i < data.KadetProfile.length; i += chunkSize) {
      const chunk = data.KadetProfile.slice(i, i + chunkSize);
      for (const kp of chunk) {
        await prisma.kadetProfile.upsert({
          where: { nrp: kp.nrp },
          update: {
            kelas: kp.kelas,
            semester: kp.semester,
            pasporNo: kp.pasporNo,
            fotoProfil: kp.fotoProfil,
            universityId: kp.universityId,
            programName: kp.programName,
            dosenStipId: kp.dosenStipId,
            mitraId: kp.mitraId,
          },
          create: {
            id: kp.id,
            userId: kp.userId,
            nrp: kp.nrp,
            kelas: kp.kelas,
            semester: kp.semester,
            pasporNo: kp.pasporNo,
            fotoProfil: kp.fotoProfil,
            universityId: kp.universityId,
            programName: kp.programName,
            startDate: kp.startDate ? new Date(kp.startDate) : null,
            endDate: kp.endDate ? new Date(kp.endDate) : null,
            dosenStipId: kp.dosenStipId,
            mitraId: kp.mitraId,
          },
        });
      }
      console.log(`   ✓ Tersimpan ${Math.min(i + chunkSize, data.KadetProfile.length)} / ${data.KadetProfile.length} profil kadet`);
    }
  }

  // 5. Immigration Docs
  if (data.ImmigrationDoc?.length) {
    console.log(`📌 Memproses ${data.ImmigrationDoc.length} Dokumen Imigrasi...`);
    for (const doc of data.ImmigrationDoc) {
      await prisma.immigrationDoc.upsert({
        where: { kadetId: doc.kadetId },
        update: {
          pasporNo: doc.pasporNo,
          ttl: doc.ttl,
          visaNo: doc.visaNo,
          visaType: doc.visaType,
          insuranceNo: doc.insuranceNo,
          insuranceProvider: doc.insuranceProvider,
          status: doc.status,
          notes: doc.notes,
        },
        create: {
          id: doc.id,
          kadetId: doc.kadetId,
          pasporNo: doc.pasporNo,
          ttl: doc.ttl,
          pasporExpiry: doc.pasporExpiry ? new Date(doc.pasporExpiry) : null,
          pasporFileUrl: doc.pasporFileUrl,
          visaNo: doc.visaNo,
          visaType: doc.visaType,
          visaExpiry: doc.visaExpiry ? new Date(doc.visaExpiry) : null,
          visaFileUrl: doc.visaFileUrl,
          insuranceNo: doc.insuranceNo,
          insuranceProvider: doc.insuranceProvider,
          insuranceExpiry: doc.insuranceExpiry ? new Date(doc.insuranceExpiry) : null,
          insuranceFileUrl: doc.insuranceFileUrl,
          status: doc.status || "PENDING",
          notes: doc.notes,
        },
      });
    }
  }

  console.log("🎉 SELURUH DATA SIKAMOS BERHASIL DIMIGRASIKAN KE CLOUD DATABASE!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat migrasi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

