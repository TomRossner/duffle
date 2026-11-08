"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical, KeyRound, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { Field } from "@/components/fields";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { deleteAccount, updatePassword } from "@/lib/actions/profile";

const menuItemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5 outline-none data-highlighted:bg-accent";

export function AccountMenu({ hasPassword }: { hasPassword: boolean }) {
  const t = useT("account");
  const tc = useT("common");
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="shrink-0">
      <Menu.Root>
        <Menu.Trigger
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label={t("actions")}
        >
          <EllipsisVertical />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
            <Menu.Popup className="min-w-56 sm:min-w-44 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
              {hasPassword ? (
                <Menu.Item className={menuItemClass} onClick={() => setChangingPassword(true)}>
                  <KeyRound className="size-3.5" />
                  {t("changePassword")}
                </Menu.Item>
              ) : null}
              <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirmingDelete(true)}>
                <Trash2 className="size-3.5" />
                {t("deleteAccount")}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {deleteError ? <p className="mt-1 text-xs text-destructive">{deleteError}</p> : null}
      <Dialog.Root open={changingPassword} onOpenChange={setChangingPassword}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto w-full max-w-md rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">{t("changePassword")}</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {t("changePasswordHint")}
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tc("close")}>
                  <X />
                </Dialog.Close>
              </div>
              <ActionForm action={updatePassword} submitLabel={t("updatePassword")} onSaved={() => setChangingPassword(false)}>
                <Field label={t("currentPassword")}>
                  <Input name="currentPassword" type="password" autoComplete="current-password" required />
                </Field>
                <Field label={t("newPassword")}>
                  <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
                </Field>
                <Field label={t("confirmNewPassword")}>
                  <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
                </Field>
              </ActionForm>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      <DeleteDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        pending={deleting}
        message={t("deleteMessage")}
        onConfirm={() => {
          setDeleting(true);
          setDeleteError(null);
          void deleteAccount().then((result) => {
            if (result && "error" in result && result.error) {
              setDeleteError(result.error);
              setDeleting(false);
              setConfirmingDelete(false);
            }
          });
        }}
      />
    </div>
  );
}
