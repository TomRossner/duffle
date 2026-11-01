import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export type AuthTokenKind = "VERIFY_EMAIL" | "RESET_PASSWORD";

const lifetimeMs: Record<AuthTokenKind, number> = {
  VERIFY_EMAIL: 24 * 60 * 60 * 1000,
  RESET_PASSWORD: 60 * 60 * 1000,
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueAuthToken(userId: string, kind: AuthTokenKind) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + lifetimeMs[kind]);
  await prisma.authToken.deleteMany({ where: { userId, kind } });
  await prisma.authToken.create({
    data: { userId, kind, tokenHash: hashToken(token), expiresAt },
  });
  return token;
}

export async function consumeAuthToken(token: string, kind: AuthTokenKind) {
  const tokenHash = hashToken(token);
  return prisma.$transaction(async (tx) => {
    const record = await tx.authToken.findUnique({ where: { tokenHash } });
    if (!record || record.kind !== kind || record.expiresAt < new Date()) return null;
    await tx.authToken.delete({ where: { id: record.id } });
    return record;
  });
}
