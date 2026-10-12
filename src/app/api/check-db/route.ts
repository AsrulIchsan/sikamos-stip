import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  let masked = "";
  try {
    const u = new URL(dbUrl);
    masked = `${u.protocol}//${u.username}:***@${u.host}${u.pathname}`;
  } catch {
    masked = dbUrl ? "invalid URL: " + dbUrl.slice(0, 15) : "EMPTY";
  }

  let dbError = null;
  let userCount = 0;
  try {
    userCount = await prisma.user.count();
  } catch (err: any) {
    dbError = err.message;
  }

  return NextResponse.json({
    maskedDbUrl: masked,
    envKeys: Object.keys(process.env).filter(
      (k) =>
        k.includes("DATABASE") ||
        k.includes("POSTGRES") ||
        k.includes("NEON") ||
        k.includes("PRISMA")
    ),
    userCount,
    dbError,
  });
}
