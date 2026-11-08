"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { DeleteDialog } from "@/components/delete-dialog";
import { useCloseFormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

type ActionState = { error?: string; ok?: boolean; token?: string; message?: string; devLink?: string } | null | undefined;

export function ActionForm({
  action,
  children,
  submitLabel,
  submitIcon,
  className,
  onSaved,
}: {
  // Actions declare their own state type and ignore the previous state, so accept any of them.
  action: (state: never, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  className?: string;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    action as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null,
  );

  const t = useT("ui");
  const tCommon = useT("common");
  const closeDialog = useCloseFormDialog();
  useEffect(() => {
    if (!state?.ok) return;
    onSaved?.();
    // Keep the dialog open when the result has something to show (a message or a link).
    if (!state.message && !state.devLink && !state.token) closeDialog?.();
  }, [state, onSaved, closeDialog]);

  return (
    <form action={formAction} className={className ?? "grid gap-3"}>
      {children}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.message ? <p className="text-sm">{state.message}</p> : null}
      {state?.devLink ? (
        <p className="text-sm">
          <a href={state.devLink} className="underline">
            {t("openEmailLink")}
          </a>
          <span className="text-muted-foreground">{t("smtpNote")}</span>
        </p>
      ) : null}
      {state?.token ? <CopyInvite token={state.token} /> : null}
      <Button type="submit" disabled={pending}>
        {submitIcon}
        {pending ? tCommon("saving") : submitLabel}
      </Button>
    </form>
  );
}

export function CopyInvite({ token }: { token: string }) {
  const t = useT("ui");
  const tCommon = useT("common");
  const link = `/invite/${token}`;
  return (
    <div className="grid gap-2 rounded-lg bg-muted p-3">
      <p className="text-sm">{t("inviteLinkHint")}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          dir="ltr"
          className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const absolute = `${window.location.origin}${link}`;
            void navigator.clipboard.writeText(absolute);
          }}
        >
          {tCommon("copy")}
        </Button>
      </div>
    </div>
  );
}

export function InlineAction({
  action,
  label,
  variant = "ghost",
  confirmMessage,
  fullWidthOnMobile = false,
  fullWidth = false,
}: {
  action: () => Promise<{ error?: string } | void>;
  label: string;
  variant?: "default" | "ghost" | "destructive" | "outline" | "secondary";
  confirmMessage?: string;
  fullWidthOnMobile?: boolean;
  fullWidth?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    async () => {
      const result = await action();
      if (result && "error" in result && result.error) return { error: result.error };
      return null;
    },
    null as { error?: string } | null,
  );
  const t = useT("ui");
  const formRef = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  // Destructive actions always ask first and carry a bin icon.
  const destructive = variant === "destructive";
  const needsConfirm = Boolean(confirmMessage) || destructive;
  const Icon = destructive ? Trash2 : null;

  return (
    <>
      <form ref={formRef} action={formAction} className={fullWidth ? "grid" : fullWidthOnMobile ? "block sm:inline" : "inline"}
      >
        <Button
          type="button"
          variant={variant}
          size={fullWidth ? "default" : "sm"}
          className={fullWidth ? "w-full" : fullWidthOnMobile ? "w-full sm:w-auto" : undefined}
          disabled={pending}
          onClick={() => {
            if (needsConfirm) setConfirming(true);
            else formRef.current?.requestSubmit();
          }}
        >
          {Icon ? <Icon /> : null}
          {label}
        </Button>
        {state?.error ? <span className="ms-2 text-xs text-destructive">{state.error}</span> : null}
      </form>
      {needsConfirm ? (
        <DeleteDialog
          open={confirming}
          onOpenChange={setConfirming}
          message={confirmMessage ?? t("confirmGeneric")}
          confirmLabel={label}
          pending={pending}
          onConfirm={() => {
            setConfirming(false);
            formRef.current?.requestSubmit();
          }}
        />
      ) : null}
    </>
  );
}
