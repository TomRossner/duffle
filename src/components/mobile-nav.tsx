"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CircleHelp, IdCard, LogIn, MapPinned, Menu, Shirt, UserPlus, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/trips", label: "Trips", icon: MapPinned },
  { href: "/closet", label: "Closet", icon: Shirt },
  { href: "/documents", label: "Documents", icon: IdCard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/how-it-works", label: "How it works", icon: CircleHelp },
];

const itemClass = "flex items-center gap-4 rounded-xl px-5 py-4 text-lg hover:bg-muted [&_svg]:size-6";

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

  // Each item slides in a little after the previous one when the menu opens.
  const item = (index: number) => ({
    className: cn(
      "transition-[opacity,translate] duration-150 ease-out motion-reduce:transition-none",
      open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
    ),
    style: { transitionDelay: open ? `${20 + index * 15}ms` : "0ms" },
  });

  const items = signedIn
    ? [
        ...links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(itemClass, pathname.startsWith(href) && "bg-muted font-medium text-primary")}
          >
            <Icon />
            {label}
          </Link>
        )),
        <div key="divider" className="my-1 h-px bg-border" />,
        <div key="sign-out">{signOut}</div>,
      ]
    : [
        <Link key="login" href="/login" onClick={() => setOpen(false)} className={itemClass}>
          <LogIn />
          Sign in
        </Link>,
        <Link key="register" href="/register" onClick={() => setOpen(false)} className={itemClass}>
          <UserPlus />
          Sign up
        </Link>,
      ];

  return (
    <div ref={containerRef} className="relative sm:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        onClick={() => setOpen((current) => !current)}
        className="relative"
      >
        <Menu
          className={cn(
            "absolute size-5 transition-all duration-150 motion-reduce:transition-none",
            open ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
        <X
          className={cn(
            "absolute size-5 transition-all duration-150 motion-reduce:transition-none",
            open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
          )}
        />
      </Button>
      <nav
        id="mobile-nav-menu"
        inert={!open}
        className={cn(
          "fixed inset-x-3 z-30 mt-2 grid origin-top gap-1.5 rounded-2xl bg-card p-4 shadow-xl ring-1 ring-foreground/10",
          "transition-[opacity,scale,translate,visibility] duration-150 ease-out motion-reduce:transition-none",
          open
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible -translate-y-3 scale-95 opacity-0 duration-100 ease-in",
        )}
      >
        {items.map((node, index) => (
          <div key={node.key} {...item(index)}>
            {node}
          </div>
        ))}
      </nav>
    </div>
  );
}
