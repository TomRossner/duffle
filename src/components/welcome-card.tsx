import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CircleHelp, Luggage, MapPinned, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getT } from "@/i18n/server";

const steps: { icon: LucideIcon; key: "create" | "group" | "plan" | "pack" }[] = [
  { icon: Plus, key: "create" },
  { icon: UserPlus, key: "group" },
  { icon: MapPinned, key: "plan" },
  { icon: Luggage, key: "pack" },
];

/** First-run guide on the Trips page, shown until the traveler has a trip. */
export async function WelcomeCard({ name }: { name?: string | null }) {
  const t = await getT("trips");
  const firstName = name?.trim().split(/\s+/)[0];
  return (
    <section className="grid gap-6 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-8">
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {firstName ? t("welcome.titleNamed", { name: firstName }) : t("welcome.title")}
        </h2>
        <p className="text-muted-foreground">{t("welcome.intro")}</p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.key} className="flex gap-3">
              <span className="relative grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
                <span className="absolute -top-1.5 -end-1.5 grid size-5 place-items-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground">
                  {index + 1}
                </span>
              </span>
              <div className="grid gap-0.5">
                <p className="font-medium">{t(`welcome.${step.key}Title`)}</p>
                <p className="text-sm text-muted-foreground">{t(`welcome.${step.key}Body`)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="grid gap-2 sm:flex">
        <Button nativeButton={false} size="lg" render={<Link href="/trips/new" />}>
          <Plus />
          {t("welcome.createFirst")}
        </Button>
        <Button nativeButton={false} size="lg" variant="outline" render={<Link href="/how-it-works" />}>
          <CircleHelp />
          {t("list.howItWorks")}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("welcome.inviteHint")}
      </p>
    </section>
  );
}
