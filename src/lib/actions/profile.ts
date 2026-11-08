"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { deleteOrAnonymizeUser } from "@/lib/account-deletion";
import { readAccountDetails } from "@/lib/account-details";
import { signOut } from "@/lib/auth";
import { getT } from "@/i18n/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/storage";
import { requireUser } from "@/lib/trip-access";
import { storeImage } from "@/lib/uploads";

export async function updateProfile(_: unknown, formData: FormData) {
  const sessionUser = await requireUser();
  const tp = await getT("profile");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: tp("errors.name") };
  if (name.length > 80) return { error: tp("errors.nameLength") };
  const details = readAccountDetails(formData, tp);
  if ("error" in details) return details;

  const stored = await storeImage(formData.get("file"), `avatars/${sessionUser.id}`);
  if ("error" in stored) return stored;

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      name,
      ...details.data,
      ...("key" in stored ? { imageKey: stored.key } : {}),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/trips", "layout");
  return { ok: true };
}

export async function updatePassword(_: unknown, formData: FormData) {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });
  const t = await getT("auth");
  if (!user?.passwordHash) return { error: t("errors.googleAccount") };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!(await compare(currentPassword, user.passwordHash))) return { error: t("errors.passwordWrong") };
  if (password.length < 8) return { error: t("errors.passwordShort") };
  if (password !== confirmPassword) return { error: t("errors.passwordMismatch") };
  if (password === currentPassword) return { error: t("errors.passwordSame") };

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash: await hash(password, 12), sessionVersion: { increment: 1 } },
  });
  await prisma.authToken.deleteMany({ where: { userId: sessionUser.id, kind: "RESET_PASSWORD" } });
  await signOut({ redirectTo: "/login?notice=password" });
}

export async function deleteAccount() {
  const sessionUser = await requireUser();
  const userId = sessionUser.id;
  const privateFiles = await prisma.personalDocument.findMany({
    where: { userId },
    select: { storageKey: true },
  });
  const profile = await prisma.user.findUnique({ where: { id: userId }, select: { imageKey: true } });
  const keys = [...privateFiles.map((file) => file.storageKey), profile?.imageKey].filter(
    (key): key is string => Boolean(key),
  );

  try {
    await prisma.$transaction((tx) => deleteOrAnonymizeUser(tx, userId));
  } catch {
    return { error: (await getT("auth"))("errors.deleteFailed") };
  }

  await Promise.all(keys.map((key) => deleteObject(key).catch(() => undefined)));
  await signOut({ redirectTo: "/" });
}
