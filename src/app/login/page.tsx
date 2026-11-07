import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { AuthLink, AuthNotice, AuthShell } from "@/components/auth-shell";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/actions/auth";

function googleErrorMessage(error?: string) {
  if (!error) return null;
  // Auth.js reports every server-side failure as "Configuration"; the real cause is in the server log.
  if (error === "Configuration") return "Google sign-in failed on the server. Try again, or use email and password.";
  if (error === "AccessDenied") return "Google did not confirm this email address.";
  return "Google sign-in failed. Try again.";
}

function noticeMessage(notice?: string) {
  if (notice === "verified") return "Email confirmed. Sign in.";
  if (notice === "password") return "Password updated. Sign in with the new one. Other sessions were signed out.";
  if (notice === "reset") return "Password updated. Sign in with the new one.";
  if (notice === "confirm") return "Confirm your email before joining a trip.";
  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/trips";
  const googleError = googleErrorMessage(params.error);
  const notice = noticeMessage(params.notice);

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to plan, pack and split costs with your travel group."
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
        <>
          No account yet? <AuthLink href="/register">Create one</AuthLink>
        </>
      }
    >
      <ActionForm action={login} submitLabel="Sign in" className="grid gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" placeholder="name@example.com" required />
        </Field>
        <div className="grid gap-2">
          <Field label="Password">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <Link
            href="/forgot-password"
            className="justify-self-end text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </ActionForm>
    </AuthShell>
  );
}
