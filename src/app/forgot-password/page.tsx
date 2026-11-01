import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-16">
      <img src="/duffle%20logo.webp" alt="Duffle" className="h-24 w-auto" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>We will email a link if this address uses a password.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={requestPasswordReset} submitLabel="Send reset link">
            <Field label="Email">
              <Input name="email" type="email" autoComplete="email" required />
            </Field>
          </ActionForm>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
