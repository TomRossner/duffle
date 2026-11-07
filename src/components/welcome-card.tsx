import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CircleHelp, Luggage, MapPinned, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Plus, title: "Create a trip", body: "Name it and set the dates, countries and currency." },
  { icon: UserPlus, title: "Bring the group", body: "Invite by email, or share a join link or QR code." },
  { icon: MapPinned, title: "Plan it together", body: "Add destinations, flights, stays and activities." },
  { icon: Luggage, title: "Pack and go", body: "Check the weather and pack from your closet." },
];

/** First-run guide on the Trips page, shown until the traveler has a trip. */
export function WelcomeCard({ name }: { name?: string | null }) {
  const firstName = name?.trim().split(/\s+/)[0];
  return (
    <section className="grid gap-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-8">
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {firstName ? `Welcome to Duffle, ${firstName}` : "Welcome to Duffle"}
        </h2>
        <p className="text-muted-foreground">Here&apos;s how a trip comes together. It takes a minute to start.</p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="flex gap-3">
              <span className="relative grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground">
                  {index + 1}
                </span>
              </span>
              <div className="grid gap-0.5">
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="grid gap-2 sm:flex">
        <Button nativeButton={false} size="lg" render={<Link href="/trips/new" />}>
          <Plus />
          Create your first trip
        </Button>
        <Button nativeButton={false} size="lg" variant="outline" render={<Link href="/how-it-works" />}>
          <CircleHelp />
          How Duffle works
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Got an invite? It shows up above this card, or open the join link someone sent you.
      </p>
    </section>
  );
}
