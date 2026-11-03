"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Pencil, X } from "lucide-react";
import { useState } from "react";
import { AccountDetailsFields } from "@/components/account-details-fields";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/components/fields";
import { ProfilePhotoField } from "@/components/profile-photo-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/lib/actions/profile";

export function ProfileEditor({
  defaults,
}: {
  defaults: {
    name: string;
    gender: string | null;
    birthDate: string;
    phone: string | null;
    country: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
        <Pencil />
        Edit profile
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">Edit profile</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Travelers see this name and photo. The rest stays on your account.
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                  <X />
                </Dialog.Close>
              </div>
              <ActionForm action={updateProfile} submitLabel="Save profile" onSaved={() => setOpen(false)}>
                <Field label="Name">
                  <Input name="name" defaultValue={defaults.name} autoComplete="name" required />
                </Field>
                <ProfilePhotoField />
                <AccountDetailsFields defaults={defaults} />
              </ActionForm>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
