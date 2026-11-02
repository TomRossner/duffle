"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Avatars render at most ~100px; 512px covers high-density screens with room to spare.
const maxDimension = 512;
const lightBytes = 300 * 1024;
const serverLimit = 5 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function compressImage(file: File): Promise<File> {
  // Keep small GIFs untouched so animation survives; everything else is checked for size.
  if (file.type === "image/gif" && file.size <= serverLimit) return file;

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
  let blob = await canvasBlob(canvas, "image/webp", 0.85);
  let type = "image/webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await canvasBlob(canvas, "image/jpeg", 0.85);
    type = "image/jpeg";
  }
  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.${type === "image/webp" ? "webp" : "jpg"}`, { type });
}

export function ProfilePhotoField() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange(input: HTMLInputElement) {
    const original = input.files?.[0];
    if (!original) {
      setStatus(null);
      return;
    }

    setBusy(true);
    setStatus(`Optimizing ${original.name}…`);
    try {
      const compressed = await compressImage(original);
      if (compressed !== original) {
        const transfer = new DataTransfer();
        transfer.items.add(compressed);
        input.files = transfer.files;
      }
      if (compressed.size > serverLimit) {
        setStatus(`${original.name} is still over 5MB. Choose a smaller photo.`);
      } else if (compressed !== original) {
        setStatus(`${original.name} · optimized ${formatSize(original.size)} → ${formatSize(compressed.size)}`);
      } else {
        setStatus(`${original.name} · ${formatSize(original.size)}`);
      }
    } catch {
      // The browser couldn't decode it (e.g. HEIC); upload the original and let the server validate.
      setStatus(`${original.name} · ${formatSize(original.size)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm leading-none font-medium">Profile picture</span>
      <label className="flex min-w-0 flex-wrap items-center gap-3">
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => void handleChange(event.currentTarget)}
        />
        <span className={cn(buttonVariants({ variant: "outline" }), busy && "pointer-events-none opacity-60")}>
          {status ? "Change photo" : "Choose photo"}
        </span>
        <span className="min-w-0 text-sm break-all text-muted-foreground">
          {status ?? "JPEG, PNG, WebP, or GIF. Large photos are resized automatically."}
        </span>
      </label>
    </div>
  );
}
