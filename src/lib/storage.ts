import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const uploadsRoot = path.join(process.cwd(), "uploads");

function s3Config() {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) return null;
  return {
    bucket,
    client: new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    }),
  };
}

function localPath(key: string) {
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  const full = path.join(uploadsRoot, normalized);
  if (!full.startsWith(uploadsRoot)) {
    throw new Error("Invalid storage key");
  }
  return full;
}

export function assertSafeKey(key: string) {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    throw new Error("Invalid storage key");
  }
  return key;
}

export async function saveObject(key: string, body: Buffer, contentType: string) {
  const safeKey = assertSafeKey(key);
  const remote = s3Config();
  if (remote) {
    await remote.client.send(
      new PutObjectCommand({
        Bucket: remote.bucket,
        Key: safeKey,
        Body: body,
        ContentType: contentType,
      }),
    );
    return;
  }

  const full = localPath(safeKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
}

export async function readObject(key: string) {
  const safeKey = assertSafeKey(key);
  const remote = s3Config();
  if (remote) {
    const result = await remote.client.send(
      new GetObjectCommand({ Bucket: remote.bucket, Key: safeKey }),
    );
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) return null;
    return {
      body: Buffer.from(bytes),
      contentType: result.ContentType ?? "application/octet-stream",
    };
  }

  try {
    const body = await readFile(localPath(safeKey));
    return { body, contentType: contentTypeFromKey(safeKey) };
  } catch {
    return null;
  }
}

function contentTypeFromKey(key: string) {
  const lower = key.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function imageExtension(mimeType: string) {
  return allowedTypes[mimeType] ?? null;
}
