import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  Bell,
  CalendarDays,
  CloudSun,
  Compass,
  FileImage,
  IdCard,
  Luggage,
  Map,
  MapPinned,
  Plus,
  Shield,
  Shirt,
  Sparkles,
  UserPlus,
  UserRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("guide");
  return { title: `${t("how.metaTitle")} · Duffle`, description: t("how.metaDescription") };
}

/** A card's copy lives at `<group>.<id>.title`, `.body`, and `.p1`…`.p<points>` in the guide messages. */
type Feature = { id: string; icon: LucideIcon; points: number };

const steps: { id: string; icon: LucideIcon }[] = [
  { id: "create", icon: Plus },
  { id: "group", icon: UserPlus },
  { id: "plan", icon: MapPinned },
  { id: "pack", icon: Luggage },
];

const tripSections: Feature[] = [
  { id: "overview", icon: Compass, points: 2 },
  { id: "map", icon: Map, points: 2 },
  { id: "weather", icon: CloudSun, points: 2 },
  { id: "schedule", icon: CalendarDays, points: 3 },
  { id: "stays", icon: BedDouble, points: 1 },
  { id: "money", icon: Wallet, points: 4 },
  { id: "documents", icon: FileImage, points: 1 },
  { id: "insurance", icon: Shield, points: 1 },
  { id: "packing", icon: Luggage, points: 3 },
];

const accountSections: Feature[] = [
  { id: "closet", icon: Shirt, points: 2 },
  { id: "documents", icon: IdCard, points: 2 },
  { id: "notifications", icon: Bell, points: 1 },
  { id: "profile", icon: UserRound, points: 1 },
];

function FeatureCard({ title, body, points, icon: Icon }: { title: string; body: string; points: string[]; icon: LucideIcon }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
      <ul className="grid gap-1.5 text-sm">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
            {point}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default async function HowItWorksPage() {
  const t = await getT("guide");
  const card = (group: "trip" | "account", feature: Feature) => {
    const base = `how.${group}.${feature.id}`;
    return (
      <FeatureCard
        key={feature.id}
        icon={feature.icon}
        title={t.dynamic(`${base}.title`, undefined, feature.id)}
        body={t.dynamic(`${base}.body`, undefined, "")}
        points={Array.from({ length: feature.points }, (_, index) => t.dynamic(`${base}.p${index + 1}`, undefined, ""))}
      />
    );
  };

  return (
    <div className="grid gap-10">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("how.heading")}</h1>
        <p className="max-w-2xl text-muted-foreground">{t("how.intro")}</p>
      </header>

      <section aria-labelledby="getting-started" className="grid gap-4">
        <h2 id="getting-started" className="text-lg font-semibold">
          {t("how.gettingStarted")}
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.id} className="flex flex-col gap-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-3xl font-semibold text-muted-foreground/40 tabular-nums">
                    {(index + 1).toLocaleString(t.locale)}
                  </span>
                </div>
                <h3 className="font-semibold">{t.dynamic(`how.steps.${step.id}.title`, undefined, step.id)}</h3>
                <p className="text-sm text-muted-foreground">{t.dynamic(`how.steps.${step.id}.body`, undefined, "")}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="inside-a-trip" className="grid gap-4">
        <div className="grid gap-1">
          <h2 id="inside-a-trip" className="text-lg font-semibold">
            {t("how.insideTrip")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("how.insideTripBody")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tripSections.map((feature) => card("trip", feature))}
        </div>
      </section>

      <section aria-labelledby="your-account" className="grid gap-4">
        <div className="grid gap-1">
          <h2 id="your-account" className="text-lg font-semibold">
            {t("how.yourAccount")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("how.yourAccountBody")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">{accountSections.map((feature) => card("account", feature))}</div>
      </section>

      <section className="flex flex-col items-start gap-4 rounded-xl bg-primary/5 p-5 ring-1 ring-primary/15 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm">
            <span className="font-medium">{t("how.readingTitle")}</span>{" "}
            <span className="text-muted-foreground">{t("how.readingBody")}</span>
          </p>
        </div>
        <Button nativeButton={false} className="w-full shrink-0 sm:w-auto" render={<Link href="/trips" />}>
          {t("how.goToTrips")}
        </Button>
      </section>
    </div>
  );
}
