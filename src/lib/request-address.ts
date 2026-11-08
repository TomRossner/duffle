import { headers } from "next/headers";
import { getT } from "@/i18n/server";
import { takeRateLimit } from "@/lib/rate-limit";

export async function clientAddress() {
  const headerList = await headers();
  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headerList.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "unknown";
}

const rules = {
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  login: { limit: 20, windowMs: 15 * 60 * 1000 },
  forgot: { limit: 5, windowMs: 60 * 60 * 1000 },
  verify: { limit: 10, windowMs: 15 * 60 * 1000 },
  reset: { limit: 8, windowMs: 15 * 60 * 1000 },
} as const;

export async function limitAuth(action: keyof typeof rules, email?: string) {
  const ip = await clientAddress();
  const rule = rules[action];
  const checks = [takeRateLimit(`${action}:${ip}`, rule.limit, rule.windowMs)];
  if (email) checks.push(takeRateLimit(`${action}:${ip}:${email}`, Math.min(rule.limit, 8), rule.windowMs));
  if (checks.some((result) => !result.ok)) return { error: (await getT("auth"))("errors.tooMany") };
  return null;
}
