"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Switches the app's language. Signed-in travelers keep it on their account too, for emails and notifications. */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return { error: "Unsupported language." };
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const session = await auth();
  if (session?.user?.id) {
    await prisma.user.update({ where: { id: session.user.id }, data: { locale } }).catch(() => undefined);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
