"use server";

import { compare, hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { readAccountDetails } from "@/lib/account-details";
import { consumeAuthToken, issueAuthToken } from "@/lib/auth-tokens";
import { signIn } from "@/lib/auth";
import { appOrigin, deliverAuthMail, mailConfigured } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { limitAuth } from "@/lib/request-address";

const accountMail =
  "Check your email. If this address can be used for an account, we sent a link.";

function emailOf(formData: FormData) {
  return String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendVerify(userId: string, email: string) {
  const token = await issueAuthToken(userId, "VERIFY_EMAIL");
  const link = `${appOrigin()}/verify-email?token=${encodeURIComponent(token)}`;
  return deliverAuthMail({
    to: email,
    subject: "Confirm your Duffle account",
    heading: "Confirm your email",
    paragraphs: [`Welcome to Duffle! Confirm ${email} to finish setting up your account.`],
    action: { label: "Confirm email", url: link },
    note: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
  });
}

async function sendExistingAccount(email: string, usesGoogle: boolean) {
  const link = `${appOrigin()}/login`;
  return deliverAuthMail({
    to: email,
    subject: "Your Duffle account",
    heading: "You already have an account",
    paragraphs: usesGoogle
      ? [`The account for ${email} uses Google sign-in. Sign in with Google to get back to your trips.`]
      : [`An account for ${email} already exists. Sign in, or reset the password if you've forgotten it.`],
    action: { label: usesGoogle ? "Sign in with Google" : "Sign in", url: link },
    secondary: usesGoogle
      ? undefined
      : { label: "Reset password", url: `${appOrigin()}/forgot-password` },
    note: "If you didn't ask for this, you can ignore this email.",
  });
}

export async function register(_: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = emailOf(formData);
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (name.length < 2) return { error: "Name must be at least 2 characters." };
  if (!validEmail(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };
  const details = readAccountDetails(formData);
  if ("error" in details) return details;

  const limited = await limitAuth("register", email);
  if (limited) return limited;
  if (process.env.NODE_ENV === "production" && !mailConfigured()) {
    return { error: "Password accounts need email delivery. Sign in with Google, or configure SMTP." };
  }

  const passwordHash = await hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.emailVerified || (existing && !existing.passwordHash)) {
    const sent = await sendExistingAccount(email, !existing.passwordHash);
    if ("error" in sent) return sent;
    return { ok: true, message: accountMail, ...("devLink" in sent ? { devLink: sent.devLink } : {}) };
  }

  let user: { id: string };
  try {
    user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name, passwordHash, emailVerified: null, sessionVersion: { increment: 1 }, ...details.data },
        })
      : await prisma.user.create({
          data: { name, email, passwordHash, emailVerified: null, ...details.data },
        });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: true, message: accountMail };
    }
    throw error;
  }

  const sent = await sendVerify(user.id, email);
  if ("error" in sent) return sent;
  return { ok: true, message: accountMail, ...("devLink" in sent ? { devLink: sent.devLink } : {}) };
}

export async function login(_: unknown, formData: FormData) {
  const email = emailOf(formData);
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/trips");
  const destination = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/trips";

  const limited = await limitAuth("login", email);
  if (limited) return limited;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash && !existing.emailVerified) {
    const valid = await compare(password, existing.passwordHash);
    if (!valid) return { error: "Invalid email or password." };
    const sent = await sendVerify(existing.id, email);
    if ("error" in sent) return sent;
    return {
      error: "Confirm your email before signing in. We sent a new link.",
      ...("devLink" in sent ? { devLink: sent.devLink } : {}),
    };
  }

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

export async function requestPasswordReset(_: unknown, formData: FormData) {
  const email = emailOf(formData);
  if (!validEmail(email)) return { error: "Enter a valid email." };
  const limited = await limitAuth("forgot", email);
  if (limited) return limited;
  if (process.env.NODE_ENV === "production" && !mailConfigured()) {
    return { error: "Password reset needs email delivery. Configure SMTP, or sign in with Google." };
  }

  const message = "If that email has a password account, we sent a reset link.";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    if (user) {
      const sent = await sendExistingAccount(email, true);
      if ("error" in sent) return sent;
      return { ok: true, message, ...("devLink" in sent ? { devLink: sent.devLink } : {}) };
    }
    return { ok: true, message };
  }

  const token = await issueAuthToken(user.id, "RESET_PASSWORD");
  const link = `${appOrigin()}/reset-password?token=${encodeURIComponent(token)}`;
  const sent = await deliverAuthMail({
    to: email,
    subject: "Reset your Duffle password",
    heading: "Reset your password",
    paragraphs: [`We got a request to reset the password for ${email}. Choose a new one below.`],
    action: { label: "Reset password", url: link },
    note: "This link expires in one hour. If you didn't ask for this, you can ignore this email — your password won't change.",
  });
  if ("error" in sent) return sent;
  return { ok: true, message, ...("devLink" in sent ? { devLink: sent.devLink } : {}) };
}

export async function verifyEmail(_: unknown, formData: FormData) {
  const limited = await limitAuth("verify");
  if (limited) return limited;
  const token = String(formData.get("token") ?? "");
  const record = await consumeAuthToken(token, "VERIFY_EMAIL");
  if (!record) return { error: "This link is invalid or has expired." };
  await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } });
  redirect("/login?notice=verified");
}

export async function resetPassword(_: unknown, formData: FormData) {
  const limited = await limitAuth("reset");
  if (limited) return limited;
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const record = await consumeAuthToken(token, "RESET_PASSWORD");
  if (!record) return { error: "This link is invalid or has expired." };
  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) return { error: "This link is invalid or has expired." };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hash(password, 12),
      emailVerified: user.emailVerified ?? new Date(),
      sessionVersion: { increment: 1 },
    },
  });

  try {
    await signIn("credentials", { email: user.email, password, redirectTo: "/trips" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?notice=reset");
    }
    throw error;
  }
}
