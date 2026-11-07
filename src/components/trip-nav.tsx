"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Compass,
  FileImage,
  Luggage,
  Map,
  Shield,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "", label: "Overview", icon: Compass },
  { href: "/map", label: "Map", icon: Map },
  { href: "/weather", label: "Weather", icon: CloudSun },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/stays", label: "Stays", icon: BedDouble },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/documents", label: "Documents", icon: FileImage },
  { href: "/insurance", label: "Insurance", icon: Shield },
  { href: "/packing", label: "Packing", icon: Luggage },
];

export function TripNav({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const updateOverflow = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const left = scroller.scrollLeft > 2;
    const right = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 2;
    setOverflow((current) => (current.left === left && current.right === right ? current : { left, right }));
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [updateOverflow]);

  // Keep the active tab visible when it sits past the edge of a narrow screen.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!scroller || !active) return;
    const target = active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [pathname]);

  function scrollBy(direction: 1 | -1) {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollBy({ left: direction * scroller.clientWidth * 0.7, behavior: "smooth" });
  }

  return (
    <nav aria-label="Trip sections" className="sticky top-0 z-10 -mx-4 min-w-0 bg-background/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
      <div className="relative border-b">
        <div
          ref={scrollerRef}
          onScroll={updateOverflow}
          className="relative flex snap-x gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {links.map((link) => {
            const href = `/trips/${tripId}${link.href}`;
            const active = link.href === "" ? pathname === href : pathname.startsWith(href);
            const Icon = link.icon;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex shrink-0 snap-start items-center gap-2 px-3 py-3 text-base whitespace-nowrap transition-colors sm:gap-1.5 sm:py-2.5 sm:text-sm",
                  "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
                  active
                    ? "font-medium text-primary after:bg-primary"
                    : "text-muted-foreground after:bg-transparent hover:text-foreground hover:after:bg-border",
                )}
              >
                <Icon className="size-5 sm:size-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {overflow.left ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center bg-gradient-to-r from-background via-background/80 to-transparent">
            <button
              type="button"
              aria-label="Scroll tabs left"
              onClick={() => scrollBy(-1)}
              className="pointer-events-auto grid size-9 place-items-center sm:size-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
        ) : null}
        {overflow.right ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-background via-background/80 to-transparent">
            <button
              type="button"
              aria-label="Scroll tabs right"
              onClick={() => scrollBy(1)}
              className="pointer-events-auto grid size-9 place-items-center sm:size-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
