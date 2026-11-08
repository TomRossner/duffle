"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { compressImage, formatFileSize, setInputFile } from "@/lib/image-compress";
import { cn } from "@/lib/utils";

const serverLimit = 5 * 1024 * 1024;

export function ProfilePhotoField() {
  const t = useT("profile");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange(input: HTMLInputElement) {
    const original = input.files?.[0];
    if (!original) {
      setStatus(null);
      return;
    }

    setBusy(true);
    setStatus(t("photo.optimizing", { name: original.name }));
    try {
      // Avatars render at most ~100px; 512px covers high-density screens with room to spare.
      const compressed = await compressImage(original, {
        maxDimension: 512,
        lightBytes: 300 * 1024,
        keepGifsUnder: serverLimit,
      });
      if (compressed !== original) setInputFile(input, compressed);
      if (compressed.size > serverLimit) {
        setStatus(t("photo.tooBig", { name: original.name }));
      } else if (compressed !== original) {
        setStatus(
          t("photo.optimized", {
            name: original.name,
            from: formatFileSize(original.size),
            to: formatFileSize(compressed.size),
          }),
        );
      } else {
        setStatus(`${original.name} · ${formatFileSize(original.size)}`);
      }
    } catch {
      // The browser couldn't decode it (e.g. HEIC); upload the original and let the server validate.
      setStatus(`${original.name} · ${formatFileSize(original.size)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm leading-none font-medium">{t("photo.label")}</span>
      <label className="flex min-w-0 flex-wrap items-center gap-3">
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => void handleChange(event.currentTarget)}
        />
        <span className={cn(buttonVariants({ variant: "outline" }), busy && "pointer-events-none opacity-60")}>
          {status ? t("photo.change") : t("photo.choose")}
        </span>
        <span className="min-w-0 text-sm break-all text-muted-foreground">
          {status ?? t("photo.hint")}
        </span>
      </label>
    </div>
  );
}
