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
import { dirOf } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "", label: "overview", icon: Compass },
  { href: "/map", label: "map", icon: Map },
  { href: "/weather", label: "weather", icon: CloudSun },
  { href: "/schedule", label: "schedule", icon: CalendarDays },
  { href: "/stays", label: "stays", icon: BedDouble },
  { href: "/money", label: "money", icon: Wallet },
  { href: "/documents", label: "tripDocuments", icon: FileImage },
  { href: "/insurance", label: "insurance", icon: Shield },
  { href: "/packing", label: "packing", icon: Luggage },
] as const satisfies readonly { href: string; label: string; icon: LucideIcon }[];

export function TripNav({ tripId }: { tripId: string }) {
  const t = useT("nav");
  const rtl = dirOf(useLocale()) === "rtl";
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  const updateOverflow = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // Right-to-left pages scroll from 0 into negative values, so measure from whichever edge they start at.
    const rtl = getComputedStyle(scroller).direction === "rtl";
    const fromStart = Math.abs(scroller.scrollLeft);
    const start = fromStart > 2;
    const end = fromStart + scroller.clientWidth < scroller.scrollWidth - 2;
    const left = rtl ? end : start;
    const right = rtl ? start : end;
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
    // Center it within the tab row, in either direction, without scrolling the page.
    const row = scroller.getBoundingClientRect();
    const tab = active.getBoundingClientRect();
    const offset = tab.left + tab.width / 2 - (row.left + row.width / 2);
    scroller.scrollBy({ left: offset, behavior: "smooth" });
  }, [pathname]);

  function scrollBy(direction: 1 | -1) {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollBy({ left: direction * scroller.clientWidth * 0.7, behavior: "smooth" });
  }

  return (
    <nav aria-label={t("tripSections")} className="sticky top-0 z-10 -mx-4 min-w-0 bg-background/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
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
                {t(link.label)}
              </Link>
            );
          })}
        </div>

        {overflow.left ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center bg-gradient-to-r from-background via-background/80 to-transparent">
            <button
              type="button"
              aria-label={rtl ? t("scrollForward") : t("scrollBack")}
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
              aria-label={rtl ? t("scrollBack") : t("scrollForward")}
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
