"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Share2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function ShareTrip({ tripId, name, url }: { tripId: string; name: string; url: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Join ${name} on Duffle: ${url}`)}`;

  if (pathname !== `/trips/${tripId}`) return null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
        <Share2 />
        Share
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">Share this trip</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Anyone with a Duffle account can join from this link.
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                  <X />
                </Dialog.Close>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={url} size={148} />
                </div>
                <div className="grid w-full min-w-0 flex-1 basis-full gap-3 sm:basis-60">
                  <input
                    readOnly
                    value={url}
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm"
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(url).then(() => {
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 2000);
                        });
                      }}
                    >
                      {copied ? <Check /> : <Copy />}
                      {copied ? "Copied" : "Copy link"}
                    </Button>
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={<a href={whatsapp} target="_blank" rel="noreferrer" />}
                    >
                      <img src="/whatsapp.png" alt="" className="size-5 rounded-full" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
