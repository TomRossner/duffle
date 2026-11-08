import { randomBytes } from "crypto";
import { getT } from "@/i18n/server";
import { imageExtension, saveObject } from "@/lib/storage";

export const maxUploadBytes = 5 * 1024 * 1024;

export type UploadError = "filesTooLarge" | "imagesTooLarge" | "typeWithPdf" | "type";

type CheckedUpload =
  | { status: "empty" }
  | { status: "invalid"; error: UploadError }
  | { status: "ok"; file: File; extension: string };

/** The message for a rejected upload, in the viewer's language. */
export async function uploadErrorText(error: UploadError) {
  return (await getT("documents"))(`upload.${error}`);
}

/** Check an uploaded file is a supported image (or PDF, when allowed) within the size limit. */
export function checkUpload(
  file: FormDataEntryValue | null,
  { allowPdf = false }: { allowPdf?: boolean } = {},
): CheckedUpload {
  if (!(file instanceof File) || file.size === 0) return { status: "empty" };
  if (file.size > maxUploadBytes) return { status: "invalid", error: allowPdf ? "filesTooLarge" : "imagesTooLarge" };
  const extension = allowPdf && file.type === "application/pdf" ? "pdf" : imageExtension(file.type);
  if (!extension) {
    return { status: "invalid", error: allowPdf ? "typeWithPdf" : "type" };
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
  if (checked.status === "invalid") return { error: await uploadErrorText(checked.error) } as const;

  const key = `${folder}/${randomBytes(16).toString("hex")}.${checked.extension}`;
  const bytes = Buffer.from(await checked.file.arrayBuffer());
  await saveObject(key, bytes, checked.file.type);
  return { key, mimeType: checked.file.type } as const;
}
