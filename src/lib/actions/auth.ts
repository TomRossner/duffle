"use server";

import { compare, hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { getLocale, getT, translatorFor } from "@/i18n/server";
import { readAccountDetails } from "@/lib/account-details";
import { consumeAuthToken, issueAuthToken } from "@/lib/auth-tokens";
import { signIn } from "@/lib/auth";
import { appOrigin, deliverAuthMail, mailConfigured } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { limitAuth } from "@/lib/request-address";

function emailOf(formData: FormData) {
  return String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** The language for an email: the account's saved one, or else the language of the page that sent it. */
async function mailLocale(saved?: string | null): Promise<Locale> {
  return isLocale(saved) ? saved : getLocale();
}

/** Switches a returning traveler to the language saved on their account. */
async function applySavedLocale(saved: string | null | undefined) {
  if (!isLocale(saved)) return;
  (await cookies()).set(LOCALE_COOKIE, saved, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

async function sendVerify(userId: string, email: string, savedLocale?: string | null) {
  const token = await issueAuthToken(userId, "VERIFY_EMAIL");
  const link = `${appOrigin()}/verify-email?token=${encodeURIComponent(token)}`;
  const locale = await mailLocale(savedLocale);
  const t = translatorFor(locale, "mail");
  return deliverAuthMail({
    to: email,
    locale,
    subject: t("verify.subject"),
    heading: t("verify.heading"),
    paragraphs: [t("verify.body", { email })],
    action: { label: t("verify.action"), url: link },
    note: t("verify.note"),
  });
}

async function sendExistingAccount(email: string, usesGoogle: boolean, savedLocale?: string | null) {
  const link = `${appOrigin()}/login`;
  const locale = await mailLocale(savedLocale);
  const t = translatorFor(locale, "mail");
  return deliverAuthMail({
    to: email,
    locale,
    subject: t("existing.subject"),
    heading: t("existing.heading"),
    paragraphs: [usesGoogle ? t("existing.google", { email }) : t("existing.password", { email })],
    action: { label: usesGoogle ? t("existing.signInGoogle") : t("existing.signIn"), url: link },
    secondary: usesGoogle
      ? undefined
      : { label: t("existing.resetPassword"), url: `${appOrigin()}/forgot-password` },
    note: t("existing.note"),
  });
}

export async function register(_: unknown, formData: FormData) {
  const [t, tp, locale] = await Promise.all([getT("auth"), getT("profile"), getLocale()]);
  const accountMail = t("messages.accountMail");
  const name = String(formData.get("name") ?? "").trim();
  const email = emailOf(formData);
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (name.length < 2) return { error: t("errors.nameShort") };
  if (!validEmail(email)) return { error: t("errors.email") };
  if (password.length < 8) return { error: t("errors.passwordShort") };
  if (password !== confirmPassword) return { error: t("errors.passwordMismatch") };
  const details = readAccountDetails(formData, tp);
  if ("error" in details) return details;

  const limited = await limitAuth("register", email);
  if (limited) return limited;
  if (process.env.NODE_ENV === "production" && !mailConfigured()) {
    return { error: t("errors.noMailRegister") };
  }

  const passwordHash = await hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.emailVerified || (existing && !existing.passwordHash)) {
    const sent = await sendExistingAccount(email, !existing.passwordHash, existing.locale);
    if ("error" in sent) return sent;
    return { ok: true, message: accountMail, ...("devLink" in sent ? { devLink: sent.devLink } : {}) };
  }

  let user: { id: string };
  try {
    user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name, passwordHash, emailVerified: null, sessionVersion: { increment: 1 }, locale, ...details.data },
        })
      : await prisma.user.create({
          data: { name, email, passwordHash, emailVerified: null, locale, ...details.data },
        });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: true, message: accountMail };
    }
    throw error;
  }

  const sent = await sendVerify(user.id, email, locale);
  if ("error" in sent) return sent;
  return { ok: true, message: accountMail, ...("devLink" in sent ? { devLink: sent.devLink } : {}) };
}

export async function login(_: unknown, formData: FormData) {
  const t = await getT("auth");
  const email = emailOf(formData);
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/trips");
  const destination = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/trips";

  const limited = await limitAuth("login", email);
  if (limited) return limited;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash && !existing.emailVerified) {
    const valid = await compare(password, existing.passwordHash);
    if (!valid) return { error: t("errors.invalidLogin") };
    const sent = await sendVerify(existing.id, email, existing.locale);
    if ("error" in sent) return sent;
    return {
      error: t("errors.confirmFirst"),
      ...("devLink" in sent ? { devLink: sent.devLink } : {}),
    };
  }

  // The saved language applies once the password checks out; signIn() redirects on success.
  if (existing?.passwordHash && (await compare(password, existing.passwordHash))) {
    await applySavedLocale(existing.locale);
  }
  try {
    await signIn("credentials", { email, password, redirectTo: destination });
  } catch (error) {
    if (error instanceof AuthError) return { error: t("errors.invalidLogin") };
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
  const t = await getT("auth");
  const email = emailOf(formData);
  if (!validEmail(email)) return { error: t("errors.email") };
  const limited = await limitAuth("forgot", email);
  if (limited) return limited;
  if (process.env.NODE_ENV === "production" && !mailConfigured()) {
    return { error: t("errors.noMailReset") };
  }

  const message = t("messages.resetSent");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    if (user) {
      const sent = await sendExistingAccount(email, true, user.locale);
      if ("error" in sent) return sent;
      return { ok: true, message, ...("devLink" in sent ? { devLink: sent.devLink } : {}) };
    }
    return { ok: true, message };
  }

  const token = await issueAuthToken(user.id, "RESET_PASSWORD");
  const link = `${appOrigin()}/reset-password?token=${encodeURIComponent(token)}`;
  const locale = await mailLocale(user.locale);
  const tm = translatorFor(locale, "mail");
  const sent = await deliverAuthMail({
    to: email,
    locale,
    subject: tm("reset.subject"),
    heading: tm("reset.heading"),
    paragraphs: [tm("reset.body", { email })],
    action: { label: tm("reset.action"), url: link },
    note: tm("reset.note"),
  });
  if ("error" in sent) return sent;
  return { ok: true, message, ...("devLink" in sent ? { devLink: sent.devLink } : {}) };
}

export async function verifyEmail(_: unknown, formData: FormData) {
  const limited = await limitAuth("verify");
  if (limited) return limited;
  const token = String(formData.get("token") ?? "");
  const record = await consumeAuthToken(token, "VERIFY_EMAIL");
  if (!record) return { error: (await getT("auth"))("errors.linkInvalid") };
  await prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } });
  redirect("/login?notice=verified");
}

export async function resetPassword(_: unknown, formData: FormData) {
  const limited = await limitAuth("reset");
  if (limited) return limited;
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const t = await getT("auth");
  if (password.length < 8) return { error: t("errors.passwordShort") };
  if (password !== confirmPassword) return { error: t("errors.passwordMismatch") };

  const record = await consumeAuthToken(token, "RESET_PASSWORD");
  if (!record) return { error: t("errors.linkInvalid") };
  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) return { error: t("errors.linkInvalid") };

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
