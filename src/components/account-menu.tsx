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
import { deleteAccount, updatePassword } from "@/lib/actions/profile";

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-accent";

export function AccountMenu({ hasPassword }: { hasPassword: boolean }) {
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="shrink-0">
      <Menu.Root>
        <Menu.Trigger
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label="Account actions"
        >
          <EllipsisVertical />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
            <Menu.Popup className="min-w-44 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
              {hasPassword ? (
                <Menu.Item className={menuItemClass} onClick={() => setChangingPassword(true)}>
                  <KeyRound className="size-3.5" />
                  Change password
                </Menu.Item>
              ) : null}
              <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirmingDelete(true)}>
                <Trash2 className="size-3.5" />
                Delete account
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {deleteError ? <p className="mt-1 text-xs text-destructive">{deleteError}</p> : null}
      {changingPassword ? (
        <Dialog.Root open onOpenChange={setChangingPassword}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
              <Dialog.Popup className="relative my-auto w-full max-w-md rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <Dialog.Title className="text-lg font-medium">Change password</Dialog.Title>
                    <Dialog.Description className="text-sm text-muted-foreground">
                      Use your current password, then choose a new one.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                    <X />
                  </Dialog.Close>
                </div>
                <ActionForm action={updatePassword} submitLabel="Update password" onSaved={() => setChangingPassword(false)}>
                  <Field label="Current password">
                    <Input name="currentPassword" type="password" autoComplete="current-password" required />
                  </Field>
                  <Field label="New password">
                    <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
                  </Field>
                  <Field label="Confirm new password">
                    <Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
                  </Field>
                </ActionForm>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
      <DeleteDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        pending={deleting}
        message="Your profile, closet, and personal documents are deleted. Trips that still have other travelers stay, with another admin in charge. Shared expenses keep a Deleted traveler so the balances still add up."
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
