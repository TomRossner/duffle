import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/i18n/server";
import { verifyEmail } from "@/lib/actions/auth";

export default async function VerifyEmailPage({
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
          <CardTitle>{t("verify.title")}</CardTitle>
          <CardDescription>{t("verify.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <ActionForm action={verifyEmail} submitLabel={t("verify.submit")}>
              <input type="hidden" name="token" value={token} />
            </ActionForm>
          ) : (
            <p className="text-sm text-destructive">{t("verify.missing")}</p>
          )}
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
