"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export function DeleteDialog({
  open,
  onOpenChange,
  message,
  confirmLabel,
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
}) {
  const t = useT("ui");
  const tCommon = useT("common");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-[80] bg-black/40" />
        <Dialog.Viewport className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <Dialog.Popup className="dialog-popup w-full max-w-sm rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
            <Dialog.Title className="text-lg font-medium">{t("confirmTitle")}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">{message}</Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                {tCommon("cancel")}
              </Button>
              <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
                {pending ? tCommon("deleting") : (confirmLabel ?? tCommon("delete"))}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
