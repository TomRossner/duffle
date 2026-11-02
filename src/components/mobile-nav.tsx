"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IdCard, LogIn, Luggage, MapPinned, Menu, UserPlus, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/trips", label: "Trips", icon: MapPinned },
  { href: "/closet", label: "Closet", icon: Luggage },
  { href: "/documents", label: "Documents", icon: IdCard },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const itemClass = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted";

export function MobileNav({ signedIn, signOut }: { signedIn: boolean; signOut?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close the menu after navigating.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative sm:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X /> : <Menu />}
      </Button>
      {open ? (
        <nav
          id="mobile-nav-menu"
          className="fixed inset-x-4 z-30 mt-2 grid gap-1 rounded-xl bg-card p-2 shadow-lg ring-1 ring-foreground/10"
        >
          {signedIn ? (
            <>
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(itemClass, pathname.startsWith(href) && "bg-muted font-medium text-primary")}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
              <div className="my-1 h-px bg-border" />
              {signOut}
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className={itemClass}>
                <LogIn className="size-4" />
                Sign in
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className={itemClass}>
                <UserPlus className="size-4" />
                Sign up
              </Link>
            </>
          )}
        </nav>
      ) : null}
    </div>
  );
}
