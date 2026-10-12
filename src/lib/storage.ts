import fs from "fs";
import path from "path";

/**
 * Menyimpan file yang diunggah.
 * - Pada lingkungan lokal: menyimpan ke filesystem publik (/public/uploads/...)
 * - Pada lingkungan Serverless / Vercel (read-only filesystem) atau jika write gagal:
 *   otomatis fallback ke Base64 Data URI sehingga aplikasi tetap berfungsi tanpa error EROFS.
 */
export async function saveUploadedFile(
  file: File,
  folder: string,
  prefix: string
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mimeType = file.type || "application/octet-stream";

  // Jika berjalan di lingkungan Vercel serverless, gunakan base64 data URI langsung
  if (process.env.VERCEL) {
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext =
      path.extname(file.name) ||
      (mimeType.includes("pdf")
        ? ".pdf"
        : mimeType.includes("png")
        ? ".png"
        : ".jpg");
    const safeFileName = `${prefix}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${folder}/${safeFileName}`;
  } catch (err) {
    console.warn(
      `[Storage Warning] Filesystem write failed, falling back to base64 data URI:`,
      err
    );
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }
}

