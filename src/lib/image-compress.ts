// Browser-only helpers for shrinking images before upload.

export function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Resize an image to fit maxDimension and re-encode it as WebP (JPEG where WebP encoding isn't supported).
 * Returns the original file when it's already small enough, isn't a decodable image, or compression doesn't help.
 * Small GIFs are kept as-is so animation survives.
 */
export async function compressImage(
  file: File,
  { maxDimension, lightBytes, quality = 0.85, keepGifsUnder }: {
    maxDimension: number;
    lightBytes: number;
    quality?: number;
    keepGifsUnder?: number;
  },
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" && keepGifsUnder !== undefined && file.size <= keepGifsUnder) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= lightBytes) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Safari can't encode WebP and silently returns PNG, so fall back to JPEG there.
  let blob = await canvasBlob(canvas, "image/webp", quality);
  let type = "image/webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await canvasBlob(canvas, "image/jpeg", quality);
    type = "image/jpeg";
  }
  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.${type === "image/webp" ? "webp" : "jpg"}`, { type });
}

/** Swap the file held by a file input, e.g. after compressing it or receiving it from a drop. */
export function setInputFile(input: HTMLInputElement, file: File) {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}
