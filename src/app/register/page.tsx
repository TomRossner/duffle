import { AccountDetailsFields } from "@/components/account-details-fields";
import { ActionForm } from "@/components/action-form";
import { AuthLink, AuthSection, AuthShell } from "@/components/auth-shell";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { getT } from "@/i18n/server";
import { register } from "@/lib/actions/auth";

export default async function RegisterPage() {
  const t = await getT("auth");
  return (
    <AuthShell
      title={t("register.title")}
      description={t("register.description")}
      wide
      footer={
        <>{t.rich("register.haveAccount", { link: (chunks) => <AuthLink href="/login">{chunks}</AuthLink> })}</>
      }
    >
      <ActionForm action={register} submitLabel={t("register.submit")} className="grid gap-6">
        <AuthSection title={t("register.account")}>
          <Field label={t("name")}>
            <Input name="name" autoComplete="name" required />
          </Field>
          <Field label={t("email")}>
            <Input name="email" type="email" autoComplete="email" placeholder={t("emailPlaceholder")} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("password")}>
              <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label={t("confirmPassword")}>
              <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
          </div>
          <p className="-mt-1 text-xs text-muted-foreground">{t("register.passwordHint")}</p>
        </AuthSection>
        <AuthSection title={t("register.aboutYou")}>
          <AccountDetailsFields />
        </AuthSection>
      </ActionForm>
    </AuthShell>
  );
}
