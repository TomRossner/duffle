import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getT } from "@/i18n/server";
import { requestPasswordReset } from "@/lib/actions/auth";

export default async function ForgotPasswordPage() {
  const t = await getT("auth");
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-16">
      <img src="/duffle%20logo.webp" alt="Duffle" className="h-24 w-auto" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("forgot.title")}</CardTitle>
          <CardDescription>{t("forgot.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={requestPasswordReset} submitLabel={t("forgot.submit")}>
            <Field label={t("email")}>
              <Input name="email" type="email" autoComplete="email" required />
            </Field>
          </ActionForm>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground underline">
              {t("forgot.backToSignIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
