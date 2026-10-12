import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Database Neon SIKAMOS (dry-morning-48962353) yang memuat 1.549 akun resmi & 1.544 profil kadet STIP
const NEON_SIKAMOS_URL =
  process.env.DATABASE_URL_OVERRIDE ||
  "postgresql://neondb_owner:npg_tfhjTHDAx08y@ep-cool-shadow-b3n6nuo0.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }
  return NEON_SIKAMOS_URL;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
