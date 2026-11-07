"use client";

import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteDialog } from "@/components/delete-dialog";
import { buttonVariants } from "@/components/ui/button";

const menuItemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5 outline-none data-highlighted:bg-accent data-disabled:cursor-default data-disabled:opacity-50";

type Result = { error?: string } | void;

export function MemberMenu({
  name,
  makeAdmin,
  remove,
}: {
  name: string;
  makeAdmin: () => Promise<Result>;
  remove: () => Promise<Result>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<"admin" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(kind: "admin" | "remove", action: () => Promise<Result>) {
    setPending(kind);
    setError(null);
    void action()
      .then((result) => {
        if (result && "error" in result && result.error) setError(result.error);
      })
      .catch(() => setError("Something went wrong. Try again."))
      .finally(() => setPending(null));
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          className={`${buttonVariants({ variant: "ghost", size: "icon-sm" })} shrink-0`}
          aria-label={`Actions for ${name}`}
          disabled={pending !== null}
        >
          <EllipsisVertical />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
            <Menu.Popup className="min-w-52 sm:min-w-40 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
              <Menu.Item className={menuItemClass} disabled={pending !== null} onClick={() => run("admin", makeAdmin)}>
                <ShieldCheck className="size-3.5" />
                {pending === "admin" ? "Saving..." : "Make admin"}
              </Menu.Item>
              <Menu.Item
                className={`${menuItemClass} text-destructive`}
                disabled={pending !== null}
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-3.5" />
                {pending === "remove" ? "Removing..." : "Remove"}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        message={`Are you sure you want to remove ${name} from this trip?`}
        confirmLabel="Remove"
        pending={pending === "remove"}
        onConfirm={() => {
          setConfirming(false);
          run("remove", remove);
        }}
      />
    </>
  );
}
