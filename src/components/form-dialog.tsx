"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const CloseFormDialog = createContext<(() => void) | null>(null);

/** Closes the surrounding FormDialog, if there is one. Forms call it after a successful save. */
export function useCloseFormDialog() {
  return useContext(CloseFormDialog);
}

type TriggerProps = {
  /** Text on the button that opens the dialog. Defaults to the title. */
  triggerLabel?: React.ReactNode;
  triggerIcon?: React.ReactNode;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "lg";
  triggerClassName?: string;
};

/**
 * A form in a dialog. Without `open`, it renders its own trigger button;
 * with `open`/`onOpenChange`, the caller opens it (from a menu item, say).
 */
export function FormDialog({
  title,
  description,
  icon,
  children,
  open: controlledOpen,
  onOpenChange,
  wide = false,
  triggerLabel,
  triggerIcon,
  triggerVariant = "default",
  triggerSize = "default",
  triggerClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  wide?: boolean;
} & TriggerProps) {
  const tCommon = useT("common");
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : uncontrolledOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <>
      {controlled ? null : (
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          onClick={() => setOpen(true)}
        >
          {triggerIcon ?? icon}
          {triggerLabel ?? title}
        </Button>
      )}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup
              className={cn(
                "dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none",
                wide ? "max-w-2xl" : "max-w-lg",
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <Dialog.Title className="flex items-center gap-2 text-lg font-medium [&_svg]:size-5 [&_svg]:shrink-0">
                    {icon}
                    {title}
                  </Dialog.Title>
                  {description ? (
                    <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>
                  ) : null}
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                  <X />
                </Dialog.Close>
              </div>
              <CloseFormDialog.Provider value={close}>{children}</CloseFormDialog.Provider>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
