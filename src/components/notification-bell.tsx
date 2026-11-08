"use client";

import { Popover } from "@base-ui/react/popover";
import { Bell, BellOff, BellRing, Check, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { INTL_LOCALES, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Notice = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  readAt: string | null;
};

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}

export function NotificationBell() {
  const t = useT("notifications");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [pushState, setPushState] = useState<"unknown" | "ready" | "unsupported" | "denied">("unknown");

  useEffect(() => {
    let stopped = false;

    const unchanged = (current: Notice[], incoming: Notice[]) =>
      current.length === incoming.length &&
      current.every((item, index) => item.id === incoming[index]?.id && item.readAt === incoming[index]?.readAt);

    const load = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok || stopped) return;
        const data = (await response.json()) as { notifications: Notice[]; unread: number };
        if (stopped) return;
        setItems((current) => (unchanged(current, data.notifications) ? current : data.notifications));
        setUnread((current) => (current === data.unread ? current : data.unread));
      } catch {
        // The page can unload while this request is in flight.
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 20000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  async function markRead() {
    await fetch("/api/notifications", { method: "POST" });
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
  }

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushState("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushState("denied");
      return;
    }
    const keyResponse = await fetch("/api/push/key");
    const { publicKey } = (await keyResponse.json()) as { publicKey?: string };
    if (!publicKey) {
      setPushState("unsupported");
      return;
    }
    const registration = await navigator.serviceWorker.register("/sw.js");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(subscription),
    });
    setPushState("ready");
  }

  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Keep this visit's unread items marked as new until the panel closes.
      setFreshIds(new Set(items.filter((item) => !item.readAt).map((item) => item.id)));
      if (unread > 0) void markRead();
    }
  }

  const fresh = items.filter((item) => freshIds.has(item.id));
  const earlier = items.filter((item) => !freshIds.has(item.id));

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger
        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "relative")}
        aria-label={unread > 0 ? t("bell.labelUnread", { count: unread }) : t("bell.label")}
      >
        <Bell />
        {unread > 0 ? (
          <span className="absolute -top-1.5 -end-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] leading-none font-semibold text-white ring-2 ring-card">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="z-50 outline-none" side="bottom" align="end" sideOffset={8} collisionPadding={16}>
          <Popover.Popup className="flex max-h-[min(32rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] origin-[var(--transform-origin)] flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10 outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <Popover.Title className="flex items-center gap-2 text-base font-semibold">
                {t("bell.label")}
                {fresh.length > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {t("bell.fresh", { count: fresh.length })}
                  </span>
                ) : null}
              </Popover.Title>
              <Popover.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={t("bell.close")}>
                <X />
              </Popover.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="grid justify-items-center gap-2 px-6 py-10 text-center">
                  <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                    <BellOff className="size-5" />
                  </span>
                  <p className="font-medium">{t("bell.caughtUp")}</p>
                  <p className="text-sm text-muted-foreground">{t("bell.caughtUpHint")}</p>
                </div>
              ) : (
                <>
                  <NoticeGroup label={t("bell.new")} items={fresh} fresh onPick={() => setOpen(false)} />
                  <NoticeGroup label={fresh.length > 0 ? t("bell.earlier") : null} items={earlier} onPick={() => setOpen(false)} />
                </>
              )}
            </div>

            <div className="flex items-center gap-3 border-t bg-muted/40 px-4 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10">
                {pushState === "ready" ? <BellRing className="size-4 text-primary" /> : <Smartphone className="size-4" />}
              </span>
              <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                {pushState === "ready"
                  ? t("bell.pushReady")
                  : pushState === "denied"
                    ? t("bell.pushDenied")
                    : pushState === "unsupported"
                      ? t("bell.pushUnsupported")
                      : t("bell.pushOffer")}
              </p>
              {pushState === "ready" ? (
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
              ) : pushState === "unknown" ? (
                <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => void enablePush()}>
                  {t("bell.turnOn")}
                </Button>
              ) : null}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

const relativeFormats = new Map<Locale, Intl.RelativeTimeFormat>();

function timeAgo(iso: string, locale: Locale, justNow: string) {
  let relative = relativeFormats.get(locale);
  if (!relative) {
    relative = new Intl.RelativeTimeFormat(INTL_LOCALES[locale], { numeric: "auto", style: "short" });
    relativeFormats.set(locale, relative);
  }
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return justNow;
}

function NoticeGroup({
  label,
  items,
  fresh = false,
  onPick,
}: {
  label: string | null;
  items: Notice[];
  fresh?: boolean;
  onPick: () => void;
}) {
  const t = useT("notifications");
  const locale = useLocale();
  if (items.length === 0) return null;
  return (
    <section className="py-2">
      {label ? (
        <p className="px-4 pt-1 pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      ) : null}
      <ul className="grid gap-0.5 px-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              onClick={onPick}
              className={cn(
                "flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                fresh && "bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full",
                  fresh ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Bell className="size-4" />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  <time dateTime={item.createdAt} className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                    {timeAgo(item.createdAt, locale, t("bell.justNow"))}
                  </time>
                </span>
                <span className="line-clamp-2 text-sm text-muted-foreground">{item.body}</span>
              </span>
              {fresh ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label={t("bell.new")} /> : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
