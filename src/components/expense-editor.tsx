"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Check, EllipsisVertical, Pencil, Trash2, Undo2, X } from "lucide-react";
import { useState } from "react";
import { DeleteDialog } from "@/components/delete-dialog";
import { ExpenseForm, type ExpenseFormDefaults } from "@/components/expense-form";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/i18n/client";

type Member = { id: string; name: string; imageKey?: string | null };

type Action = (
  state: { error?: string; ok?: boolean } | null | undefined,
  formData: FormData,
) => Promise<{ error?: string; ok?: boolean } | null | undefined>;

type RunAction = () => Promise<{ error?: string } | void>;

const menuItemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5 outline-none data-highlighted:bg-accent";

export function ExpenseRowMenu({
  title,
  action,
  members,
  currency,
  defaults,
  markPaid,
  remove,
}: {
  title: string;
  action: Action;
  members: Member[];
  currency: string;
  defaults: ExpenseFormDefaults;
  markPaid?: { paid: boolean; action: RunAction };
  remove: RunAction;
}) {
  const t = useT("money");
  const tCommon = useT("common");
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settlement = defaults.category === "SETTLEMENT";

  async function run(next: RunAction) {
    setError(null);
    const result = await next();
    if (result && "error" in result && result.error) setError(result.error);
  }

  return (
    <div className="flex flex-col items-end">
      <Menu.Root>
        <Menu.Trigger
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label={tCommon("actionsFor", { name: title })}
        >
          <EllipsisVertical />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
            <Menu.Popup className="min-w-48 sm:min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
              <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" />
                {tCommon("edit")}
              </Menu.Item>
              {markPaid ? (
                <Menu.Item className={menuItemClass} onClick={() => void run(markPaid.action)}>
                  {markPaid.paid ? <Undo2 className="size-3.5" /> : <Check className="size-3.5" />}
                  {markPaid.paid ? t("editor.markUnpaid") : t("editor.markPaid")}
                </Menu.Item>
              ) : null}
              <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirming(true)}>
                <Trash2 className="size-3.5" />
                {tCommon("delete")}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      <Dialog.Root open={editing} onOpenChange={setEditing}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">{t("editor.editTitle")}</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {t("editor.editDescription")}
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                  <X />
                </Dialog.Close>
              </div>
              <ExpenseForm
                action={action}
                members={members}
                currency={currency}
                submitLabel={tCommon("save")}
                includeCategory={!settlement}
                defaultCategory={defaults.category}
                defaults={defaults}
                onSaved={() => setEditing(false)}
              />
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        message={t("editor.confirmDelete", { title })}
        onConfirm={() => {
          setConfirming(false);
          void run(remove);
        }}
      />
    </div>
  );
}
