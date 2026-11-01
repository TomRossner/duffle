"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Notifications"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && unread > 0) void markRead();
        }}
      >
        <Bell />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
            {unread}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="fixed inset-x-4 z-30 mt-2 max-h-[70dvh] overflow-y-auto rounded-xl bg-card p-3 shadow-lg ring-1 ring-foreground/10 sm:absolute sm:inset-x-auto sm:right-0 sm:w-80">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Notifications</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => void enablePush()}>
              {pushState === "ready" ? "Alerts on" : "Enable alerts"}
            </Button>
          </div>
          {pushState === "unsupported" ? (
            <p className="mb-2 text-xs text-muted-foreground">Browser alerts need notification permission and push keys.</p>
          ) : null}
          {pushState === "denied" ? (
            <p className="mb-2 text-xs text-muted-foreground">Notifications are blocked in this browser.</p>
          ) : null}
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing new.</p>
          ) : (
            <ul className="grid max-h-80 gap-2 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <a href={item.href} className={cn("block rounded-lg px-2 py-1.5 hover:bg-muted", !item.readAt && "bg-muted/60")}>
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.body}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
