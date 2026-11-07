import { AccountDetailsFields } from "@/components/account-details-fields";
import { ActionForm } from "@/components/action-form";
import { AuthLink, AuthSection, AuthShell } from "@/components/auth-shell";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { register } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Use Google, or fill in your details. We'll email you a link to confirm your address."
      wide
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <ActionForm action={register} submitLabel="Create account" className="grid gap-6">
        <AuthSection title="Account">
          <Field label="Name">
            <Input name="name" autoComplete="name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" placeholder="name@example.com" required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Password">
              <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label="Confirm password">
              <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
          </div>
          <p className="-mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
        </AuthSection>
        <AuthSection title="About you">
          <AccountDetailsFields />
        </AuthSection>
      </ActionForm>
    </AuthShell>
  );
}
