import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding database SIKAMOS STIP INDONESIA...");

  // 1. Super Admin Utama (Pengelola Sistem, Manajemen Role, Audit Log)
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@stip.ac.id" },
    update: {
      role: "SUPER_ADMIN",
      isActive: true,
      name: "Super Admin Utama (BPSDM / STIP)",
    },
    create: {
      id: "super_admin_stip",
      name: "Super Admin Utama (BPSDM / STIP)",
      email: "superadmin@stip.ac.id",
      password: "superadmin123",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log("✓ Super Admin initialized:", superAdmin.email);

  // 2. Admin Operasional Mobilitas
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@stip.ac.id" },
    update: {
      role: "ADMIN",
      isActive: true,
      name: "Admin Operasional STIP Indonesia",
    },
    create: {
      id: "admin_operasional",
      name: "Admin Operasional STIP Indonesia",
      email: "admin@stip.ac.id",
      password: "admin123",
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✓ Admin Operasional initialized:", adminUser.email);

  // 3. Dosen Pembimbing Internal STIP
  const dosenUser = await prisma.user.upsert({
    where: { email: "dosen@stip.ac.id" },
    update: {
      role: "DOSEN_STIP",
      isActive: true,
      name: "Capt. Sugeng Hartono, M.Mar., M.Pd.",
    },
    create: {
      id: "dosen_stip_01",
      name: "Capt. Sugeng Hartono, M.Mar., M.Pd.",
      email: "dosen@stip.ac.id",
      password: "dosen123",
      role: "DOSEN_STIP",
      isActive: true,
    },
  });
  console.log("✓ Dosen STIP initialized:", dosenUser.email);

  // 4. Pembimbing Mitra Kampus Luar Negeri
  const mitraUser = await prisma.user.upsert({
    where: { email: "mitra@wmu.se" },
    update: {
      role: "MITRA",
      isActive: true,
      name: "Prof. Henrik Nilsson, Ph.D.",
    },
    create: {
      id: "mitra_wmu_01",
      name: "Prof. Henrik Nilsson, Ph.D.",
      email: "mitra@wmu.se",
      password: "mitra123",
      role: "MITRA",
      isActive: true,
    },
  });
  console.log("✓ Mitra Luar Negeri initialized:", mitraUser.email);

  // 5. Master Data Negara (Modul 2 & 3)
  const countriesData = [
    { code: "SE", name: "Swedia (Sweden)" },
    { code: "JP", name: "Jepang (Japan)" },
    { code: "NL", name: "Belanda (Netherlands)" },
    { code: "SG", name: "Singapura (Singapore)" },
  ];

  for (const c of countriesData) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: { code: c.code, name: c.name },
    });
  }

  // 6. Master Data Universitas Mitra
  const swedia = await prisma.country.findUnique({ where: { code: "SE" } });
  if (swedia) {
    const existingWmu = await prisma.university.findFirst({
      where: { name: { contains: "World Maritime University" } },
    });
    if (!existingWmu) {
      await prisma.university.create({
        data: {
          name: "World Maritime University (WMU)",
          countryId: swedia.id,
          address: "Fiskehamnsgatan 1, 211 18 Malmö, Sweden",
          website: "https://www.wmu.se",
        },
      });
    }
  }

  const jepang = await prisma.country.findUnique({ where: { code: "JP" } });
  if (jepang) {
    const existingTumst = await prisma.university.findFirst({
      where: { name: { contains: "Tokyo University" } },
    });
    if (!existingTumst) {
      await prisma.university.create({
        data: {
          name: "Tokyo University of Marine Science and Technology",
          countryId: jepang.id,
          address: "4 Chome-5-7 Konan, Minato City, Tokyo, Japan",
          website: "https://www.kaiyodai.ac.jp",
        },
      });
    }
  }

  console.log("✅ Seeding database SIKAMOS STIP INDONESIA selesai dengan aman!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
