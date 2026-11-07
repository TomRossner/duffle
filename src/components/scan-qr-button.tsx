"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Camera, RotateCcw, ScanLine, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Trip links a QR code can carry: the shared join link or a personal invite. */
const TRIP_LINK = /^\/(join|invite)\/[^/?#]+\/?$/;

function tripPath(text: string) {
  try {
    const url = new URL(text.trim(), window.location.origin);
    return TRIP_LINK.test(url.pathname) ? url.pathname : null;
  } catch {
    return null;
  }
}

/** Opens the camera and follows a scanned Duffle trip link. Shown on phone-sized screens only. */
export function ScanQrButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button type="button" variant="outline" className={cn("sm:hidden", className)} onClick={() => setOpen(true)}>
        <ScanLine className="size-4" />
        Scan QR code
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/60" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="dialog-popup relative w-full max-w-sm rounded-xl bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">Scan a trip QR code</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Point the camera at a Duffle join code.
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                  <X />
                </Dialog.Close>
              </div>
              {open ? <Scanner onDone={close} /> : null}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/** Reads a QR code from a photo. Works without camera permission, through the phone's own camera app. */
async function readPhoto(file: File) {
  const { default: jsQR } = await import("jsqr");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

function Scanner({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "opening">("starting");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [cameraFailed, setCameraFailed] = useState(false);

  async function scanPhoto(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const text = await readPhoto(file);
      const path = text ? tripPath(text) : null;
      if (path) {
        setStatus("opening");
        onDone();
        router.push(path);
        return;
      }
      setError(text ? "That QR code is not a Duffle trip link." : "No QR code found in that photo. Try again closer up.");
    } catch {
      setError("Couldn't read that photo. Try again.");
    } finally {
      if (photoRef.current) photoRef.current.value = "";
    }
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraFailed(true);
        setError("This browser can't show the camera here. Take a photo of the code instead.");
        return;
      }
      try {
        const [{ default: jsQR }, media] = await Promise.all([
          import("jsqr"),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }),
        ]);
        stream = media;
        if (stopped) return;
        const video = videoRef.current;
        if (!video || !context) return;
        video.srcObject = media;
        await video.play();
        setStatus("scanning");

        const tick = () => {
          if (stopped) return;
          if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            // Scanning a downscaled frame keeps each pass fast on phones.
            const scale = Math.min(1, 640 / video.videoWidth);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" });
            if (code?.data) {
              const path = tripPath(code.data);
              if (path) {
                stopped = true;
                setStatus("opening");
                onDone();
                router.push(path);
                return;
              }
              setError("That QR code is not a Duffle trip link.");
            }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      } catch (cause) {
        if (stopped) return;
        const name = cause instanceof DOMException ? cause.name : "";
        setCameraFailed(true);
        setError(
          name === "NotAllowedError"
            ? "Duffle can't use the camera. Take a photo of the code instead, or allow camera access for this site and try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "The camera couldn't start. It may be in use by another app.",
        );
      }
    }

    void start();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onDone, router, attempt]);

  return (
    <div className="grid gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} muted playsInline className="size-full object-cover" />
        {status === "scanning" ? (
          <div className="pointer-events-none absolute inset-[15%] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        ) : (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            {status === "opening" ? "Opening trip..." : cameraFailed ? "Camera unavailable" : "Starting camera..."}
          </p>
        )}
      </div>
      {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => void scanPhoto(event.target.files?.[0])}
      />
      <div className="grid gap-2">
        <Button
          type="button"
          variant={cameraFailed ? "default" : "outline"}
          disabled={status === "opening"}
          onClick={() => photoRef.current?.click()}
        >
          <Camera />
          {cameraFailed ? "Take a photo of the code" : "Scan a photo instead"}
        </Button>
        {cameraFailed ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              setCameraFailed(false);
              setStatus("starting");
              setAttempt((current) => current + 1);
            }}
          >
            <RotateCcw />
            Try the camera again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
