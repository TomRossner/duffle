import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getT } from "@/i18n/server";
import { resetPassword } from "@/lib/actions/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = await getT("auth");

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-16">
      <img src="/duffle%20logo.webp" alt="Duffle" className="h-24 w-auto" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("reset.title")}</CardTitle>
          <CardDescription>{t("reset.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <ActionForm action={resetPassword} submitLabel={t("reset.submit")}>
              <input type="hidden" name="token" value={token} />
              <Field label={t("newPassword")}>
                <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
              </Field>
              <Field label={t("confirmPassword")}>
                <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
              </Field>
            </ActionForm>
          ) : (
            <p className="text-sm text-destructive">{t("reset.missing")}</p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/forgot-password" className="text-foreground underline">
              {t("reset.requestNew")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
