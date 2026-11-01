"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";

type ActionState = { error?: string; ok?: boolean; token?: string; message?: string; devLink?: string } | null | undefined;

export function ActionForm({
  action,
  children,
  submitLabel,
  submitIcon,
  className,
  onSaved,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  className?: string;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.ok) onSaved?.();
  }, [state, onSaved]);

  return (
    <form action={formAction} className={className ?? "grid gap-3"}>
      {children}
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.message ? <p className="text-sm">{state.message}</p> : null}
      {state?.devLink ? (
        <p className="text-sm">
          <a href={state.devLink} className="underline">
            Open the email link
          </a>
          <span className="text-muted-foreground"> (shown because SMTP is not configured)</span>
        </p>
      ) : null}
      {state?.token ? <CopyInvite token={state.token} /> : null}
      <Button type="submit" disabled={pending}>
        {submitIcon}
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

export function CopyInvite({ token }: { token: string }) {
  const link = `/invite/${token}`;
  return (
    <div className="grid gap-2 rounded-lg bg-muted p-3">
      <p className="text-sm">Share this link with the traveler. It matches the email you entered.</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
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
          Copy
        </Button>
      </div>
    </div>
  );
}

function confirmText(label: string, confirmMessage?: string) {
  if (confirmMessage) return confirmMessage;
  if (/^delete$/i.test(label.trim())) return "Are you sure you want to delete this?";
  if (/^remove$/i.test(label.trim())) return "Are you sure you want to remove this?";
  return `Are you sure you want to ${label.trim().toLowerCase()}?`;
}

export function InlineAction({
  action,
  label,
  variant = "ghost",
  confirmMessage,
}: {
  action: () => Promise<{ error?: string } | void>;
  label: string;
  variant?: "ghost" | "destructive" | "outline" | "secondary";
  confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async () => {
      const result = await action();
      if (result && "error" in result && result.error) return { error: result.error };
      return null;
    },
    null as { error?: string } | null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const needsConfirm = Boolean(confirmMessage) || /delete|remove/i.test(label);
  const Icon = /delete|remove/i.test(label) ? Trash2 : /^edit/i.test(label) ? Pencil : null;

  return (
    <>
      <form ref={formRef} action={formAction} className="inline">
        <Button
          type="button"
          variant={variant}
          size="sm"
          disabled={pending}
          onClick={() => {
            if (needsConfirm) setConfirming(true);
            else formRef.current?.requestSubmit();
          }}
        >
          {Icon ? <Icon /> : null}
          {label}
        </Button>
        {state?.error ? <span className="ml-2 text-xs text-destructive">{state.error}</span> : null}
      </form>
      {needsConfirm ? (
        <DeleteDialog
          open={confirming}
          onOpenChange={setConfirming}
          message={confirmText(label, confirmMessage)}
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
