import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { AuthLink, AuthNotice, AuthShell } from "@/components/auth-shell";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { getT } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";
import { login } from "@/lib/actions/auth";

function googleErrorMessage(t: Translator<"auth">, error?: string) {
  if (!error) return null;
  // Auth.js reports every server-side failure as "Configuration"; the real cause is in the server log.
  if (error === "Configuration") return t("google.configuration");
  if (error === "AccessDenied") return t("google.accessDenied");
  return t("google.failed");
}

function noticeMessage(t: Translator<"auth">, notice?: string) {
  if (notice === "verified") return t("notices.verified");
  if (notice === "password") return t("notices.password");
  if (notice === "reset") return t("notices.reset");
  if (notice === "confirm") return t("notices.confirm");
  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const t = await getT("auth");
  const callbackUrl = params.callbackUrl ?? "/trips";
  const googleError = googleErrorMessage(t, params.error);
  const notice = noticeMessage(t, params.notice);

  return (
    <AuthShell
      title={t("login.title")}
      description={t("login.description")}
      callbackUrl={callbackUrl}
      notices={
        googleError || notice ? (
          <div className="grid gap-2">
            {googleError ? <AuthNotice tone="error">{googleError}</AuthNotice> : null}
            {notice ? <AuthNotice>{notice}</AuthNotice> : null}
          </div>
        ) : null
      }
      footer={
        <>{t.rich("login.noAccount", { link: (chunks) => <AuthLink href="/register">{chunks}</AuthLink> })}</>
      }
    >
      <ActionForm action={login} submitLabel={t("login.submit")} className="grid gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field label={t("email")}>
          <Input name="email" type="email" autoComplete="email" placeholder={t("emailPlaceholder")} required />
        </Field>
        <div className="grid gap-2">
          <Field label={t("password")}>
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <Link
            href="/forgot-password"
            className="justify-self-end text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("login.forgot")}
          </Link>
        </div>
      </ActionForm>
    </AuthShell>
  );
}
