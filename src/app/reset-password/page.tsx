import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/actions/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-16">
      <img src="/duffle%20logo.webp" alt="Duffle" className="h-24 w-auto" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>This also signs out any other sessions on the account.</CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <ActionForm action={resetPassword} submitLabel="Save password">
              <input type="hidden" name="token" value={token} />
              <Field label="New password">
                <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
              </Field>
              <Field label="Confirm password">
                <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
              </Field>
            </ActionForm>
          ) : (
            <p className="text-sm text-destructive">This reset link is missing.</p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/forgot-password" className="text-foreground underline">
              Request a new link
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
