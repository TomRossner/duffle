import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoogleSignIn } from "@/components/google-sign-in";
import { login } from "@/lib/actions/auth";

function googleErrorMessage(error?: string) {
  if (!error) return null;
  if (error === "Configuration") return "Google sign-in is not configured yet. Add the OAuth client to .env.";
  if (error === "AccessDenied") return "Google did not confirm this email address.";
  return "Google sign-in failed. Try again.";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/trips";
  const googleError = googleErrorMessage(params.error);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-16">
      <img src="/duffle%20logo.webp" alt="Duffle" className="h-24 w-auto" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use Google, or the email and password for your Duffle account.</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignIn callbackUrl={callbackUrl} />
          {googleError ? <p className="mt-3 text-sm text-destructive">{googleError}</p> : null}
          <p className="my-4 text-center text-xs text-muted-foreground">or</p>
          <ActionForm action={login} submitLabel="Sign in">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Field label="Email">
              <Input name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" autoComplete="current-password" required />
            </Field>
          </ActionForm>
          <p className="mt-4 text-sm text-muted-foreground">
            No account yet?{" "}
            <Link href="/register" className="text-foreground underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
