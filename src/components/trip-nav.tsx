"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
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

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-2">
      {links.map((link) => {
        const href = `/trips/${tripId}${link.href}`;
        const active = link.href === "" ? pathname === href : pathname.startsWith(href);
        const Icon = link.icon;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
