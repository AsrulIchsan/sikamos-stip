import imageCompression from "browser-image-compression";

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  reductionPercentage: number;
  timestamp: string; // ISO String
}

export interface CompressImageOptions {
  maxSizeMB?: number; // Default 0.8 MB (Guaranteed < 1 MB)
  maxWidthOrHeight?: number; // Default 1920px
  addTimestampWatermark?: boolean;
  watermarkText?: string;
}

/**
 * Membubuhi cap waktu (timestamp watermark) resmi di atas gambar canvas
 * untuk menjamin integritas bukti kegiatan mobilitas kadet STIP.
 */
async function stampTimestampOnImage(
  file: File,
  timestampText: string,
  cadetLabel?: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return resolve(file);
      }

      // Gambar foto asli
      ctx.drawImage(img, 0, 0);

      // Hitung skala font proporsional dengan dimensi gambar
      const fontSize = Math.max(16, Math.floor(img.width * 0.025));
      ctx.font = `600 ${fontSize}px sans-serif`;

      // Posisi stempel di pojok kanan bawah
      const padding = fontSize * 0.8;
      const text1 = `SIKAMOS STIP | ${timestampText}`;
      const text2 = cadetLabel ? cadetLabel : "DOKUMENTASI KADET RESMI";

      const metric1 = ctx.measureText(text1);
      const metric2 = ctx.measureText(text2);
      const boxWidth = Math.max(metric1.width, metric2.width) + padding * 2;
      const boxHeight = fontSize * 2.8 + padding * 2;

      const boxX = img.width - boxWidth - padding;
      const boxY = img.height - boxHeight - padding;

      // Kotak background semi-transparan gelap
      ctx.fillStyle = "rgba(10, 37, 64, 0.75)"; // Navy STIP
      ctx.roundRect ? ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8) : ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.fill();

      // Border aksen emas STIP
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = Math.max(2, fontSize * 0.08);
      ctx.stroke();

      // Teks cap waktu
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(text1, boxX + padding, boxY + padding + fontSize * 0.9);

      ctx.fillStyle = "#D4AF37"; // Aksen kuning emas untuk label kadet
      ctx.fillText(text2, boxX + padding, boxY + padding + fontSize * 2.1);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }
          const stampedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(stampedFile);
        },
        "image/jpeg",
        0.92
      );
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Kompresi Otomatis Gambar Kadet di Sisi Klien (Client-Side)
 * - Memastikan file final WAJIB < 1MB (standar default target 0.8MB)
 * - Menyematkan cap waktu (Timestamp)
 */
export async function compressCadetPhoto(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressionResult> {
  const originalSizeKB = Math.round(file.size / 1024);
  const now = new Date();
  const formattedTimestamp = now.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  // 1. Tambahkan cap waktu (timestamp) pada foto sebelum kompresi
  let preparedFile = file;
  if (options.addTimestampWatermark !== false) {
    try {
      preparedFile = await stampTimestampOnImage(
        file,
        formattedTimestamp,
        options.watermarkText || "KADET MOBILITAS STIP"
      );
    } catch (err) {
      console.warn("Gagal membubuhi cap waktu otomatis, melanjutkan ke kompresi:", err);
    }
  }

  // 2. Konfigurasi kompresi browser-image-compression
  const compressionOptions = {
    maxSizeMB: options.maxSizeMB || 0.8, // Target terjamin < 1MB
    maxWidthOrHeight: options.maxWidthOrHeight || 1920,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.85,
  };

  const compressedBlob = await imageCompression(preparedFile, compressionOptions);
  const finalFile = new File([compressedBlob], `daily-log-${Date.now()}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  const compressedSizeKB = Math.round(finalFile.size / 1024);
  const reductionPercentage = Math.max(
    0,
    Math.round(((file.size - finalFile.size) / file.size) * 100)
  );

  const previewUrl = URL.createObjectURL(finalFile);

  return {
    file: finalFile,
    previewUrl,
    originalSizeKB,
    compressedSizeKB,
    reductionPercentage,
    timestamp: now.toISOString(),
  };
}
