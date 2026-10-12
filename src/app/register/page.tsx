import Link from "next/link";
import { AccountDetailsFields } from "@/components/account-details-fields";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { GoogleSignIn } from "@/components/google-sign-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { register } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg items-start px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Use Google, or your details and a password.</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignIn />
          <p className="my-4 text-center text-xs text-muted-foreground">or</p>
          <ActionForm action={register} submitLabel="Create account">
            <Field label="Name">
              <Input name="name" autoComplete="name" required />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" autoComplete="email" required />
            </Field>
            <AccountDetailsFields />
            <Field label="Password">
              <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label="Confirm password">
              <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
          </ActionForm>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
