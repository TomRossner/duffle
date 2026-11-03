"use client";

import { useSyncExternalStore } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const NOTICE_COOKIE = "duffle-cookie-notice";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isDismissed() {
  return document.cookie.split("; ").some((entry) => entry.startsWith(`${NOTICE_COOKIE}=`));
}

function dismiss() {
  document.cookie = `${NOTICE_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((listener) => listener());
}

export function CookieNotice() {
  // Hidden during server render; the browser decides once it can read document.cookie.
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true);
  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl bg-card p-4 text-sm shadow-xl ring-1 ring-foreground/10 sm:flex-row sm:items-center"
    >
      <Cookie className="hidden size-5 shrink-0 text-muted-foreground sm:block" aria-hidden />
      <p className="flex-1 text-muted-foreground">
        This site uses cookies to keep you signed in and remember your preferences.
      </p>
      <Button onClick={dismiss} className="w-full sm:w-auto">
        Got it
      </Button>
    </div>
  );
}
