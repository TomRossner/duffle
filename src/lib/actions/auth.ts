"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { readAccountDetails } from "@/lib/account-details";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function register(_: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (name.length < 2) return { error: "Name must be at least 2 characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };
  const details = readAccountDetails(formData);
  if ("error" in details) return details;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash === null) {
    return { error: "This email uses Google sign-in. Continue with Google instead." };
  }
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await hash(password, 12);
  await prisma.user.create({ data: { name, email, passwordHash, ...details.data } });

  try {
    await signIn("credentials", { email, password, redirectTo: "/trips" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created, but sign-in failed." };
    throw error;
  }
}

export async function login(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/trips");
  const destination = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/trips";

  try {
    await signIn("credentials", { email, password, redirectTo: destination });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error;
  }

  redirect(destination);
}

export async function loginWithGoogle(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "/trips");
  const destination = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/trips";
  await signIn("google", { redirectTo: destination });
}
