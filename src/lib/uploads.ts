import { randomBytes } from "crypto";
import { imageExtension, saveObject } from "@/lib/storage";

export const maxUploadBytes = 5 * 1024 * 1024;

type CheckedUpload = { status: "empty" } | { status: "invalid"; error: string } | { status: "ok"; file: File; extension: string };

/** Check an uploaded file is a supported image (or PDF, when allowed) within the size limit. */
export function checkUpload(
  file: FormDataEntryValue | null,
  { allowPdf = false }: { allowPdf?: boolean } = {},
): CheckedUpload {
  if (!(file instanceof File) || file.size === 0) return { status: "empty" };
  const kind = allowPdf ? "Files" : "Images";
  if (file.size > maxUploadBytes) return { status: "invalid", error: `${kind} must be 5MB or smaller.` };
  const extension = allowPdf && file.type === "application/pdf" ? "pdf" : imageExtension(file.type);
  if (!extension) {
    return { status: "invalid", error: allowPdf ? "Use a PDF, JPEG, PNG, WebP, or GIF." : "Use a JPEG, PNG, WebP, or GIF." };
  }
  return { status: "ok", file, extension };
}

export async function storeImage(
  file: FormDataEntryValue | null,
  folder: string,
  options: { allowPdf?: boolean } = {},
) {
  const checked = checkUpload(file, options);
  if (checked.status === "empty") return { empty: true as const };
  if (checked.status === "invalid") return { error: checked.error } as const;

  const key = `${folder}/${randomBytes(16).toString("hex")}.${checked.extension}`;
  const bytes = Buffer.from(await checked.file.arrayBuffer());
  await saveObject(key, bytes, checked.file.type);
  return { key, mimeType: checked.file.type } as const;
}
