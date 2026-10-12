import {
  BedDouble,
  Car,
  Circle,
  Handshake,
  Plane,
  Shield,
  Ticket,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  FLIGHT: Plane,
  STAY: BedDouble,
  ACTIVITY: Ticket,
  INSURANCE: Shield,
  FOOD: Utensils,
  TRANSPORT: Car,
  SETTLEMENT: Handshake,
  DINNER: Utensils,
  TRANSFER: Car,
  MEETUP: Users,
  OTHER: Circle,
};

export function KindIcon({ kind, className }: { kind: string; className?: string }) {
  const Icon = ICONS[kind] ?? Circle;
  return <Icon className={className ?? "size-4"} aria-hidden />;
}
