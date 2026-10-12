import { randomBytes } from "crypto";
import { imageExtension, saveObject } from "@/lib/storage";

const maxBytes = 5 * 1024 * 1024;

export async function storeImage(file: FormDataEntryValue | null, folder: string) {
  if (!(file instanceof File) || file.size === 0) return { empty: true as const };
  if (file.size > maxBytes) return { error: "Images must be 5MB or smaller." } as const;
  const extension = imageExtension(file.type);
  if (!extension) return { error: "Use a JPEG, PNG, WebP, or GIF." } as const;

  const key = `${folder}/${randomBytes(16).toString("hex")}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await saveObject(key, bytes, file.type);
  return { key, mimeType: file.type } as const;
}
