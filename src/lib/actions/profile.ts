"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { readAccountDetails } from "@/lib/account-details";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";
import { storeImage } from "@/lib/uploads";

export async function updateProfile(_: unknown, formData: FormData) {
  const sessionUser = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter your name." };
  if (name.length > 80) return { error: "Name must be 80 characters or fewer." };
  const details = readAccountDetails(formData);
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
  if (!user?.passwordHash) return { error: "This account signs in with Google." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!(await compare(currentPassword, user.passwordHash))) return { error: "Current password is wrong." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };
  if (password === currentPassword) return { error: "Choose a different password." };

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash: await hash(password, 12) },
  });
  return { ok: true };
}

export async function deleteAccount() {
  const sessionUser = await requireUser();
  const userId = sessionUser.id;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.trip.deleteMany({ where: { ownerId: userId } });
      await tx.insurancePolicy.deleteMany({ where: { userId } });
      await tx.document.deleteMany({ where: { userId } });
      await tx.expense.deleteMany({ where: { paidById: userId } });
      await tx.expenseShare.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  } catch {
    return { error: "Could not delete the account." };
  }

  await signOut({ redirectTo: "/" });
}
