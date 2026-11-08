import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CloudSun, FileText, Luggage, MapPinned, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { currentUser } from "@/lib/trip-access";

const features = [
  { icon: MapPinned, id: "map" },
  { icon: CalendarDays, id: "schedule" },
  { icon: CloudSun, id: "weather" },
  { icon: FileText, id: "documents" },
  { icon: Luggage, id: "packing" },
  { icon: Wallet, id: "expenses" },
] as const;

export default async function HomePage() {
  const user = await currentUser();
  if (user) redirect("/trips");
  const t = await getT("guide");

  return (
    <main className="mx-auto flex w-full flex-1 max-w-4xl flex-col justify-center gap-12 px-6 pt-6 pb-16 sm:pt-10 sm:pb-24">
      <section className="flex flex-col items-center gap-5 text-center sm:items-start sm:text-start">
        <img src="/duffle%20logo.webp" alt="Duffle" className="h-20 w-auto sm:h-28" />
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {t("landing.heading")}
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">
          {t("landing.intro")}
        </p>
        <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button nativeButton={false} size="lg" className="w-full sm:w-auto" render={<Link href="/register" />}>
            {t("landing.register")}
          </Button>
          <Button
            nativeButton={false}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            render={<Link href="/login" />}
          >
            {t("landing.signIn")}
          </Button>
        </div>
      </section>

      <section aria-label={t("landing.features")} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {features.map(({ icon: Icon, id }) => (
          <div
            key={id}
            className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 text-center ring-1 ring-foreground/10 sm:items-start sm:text-start"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <h2 className="text-sm font-medium">{t(`landing.${id}.title`)}</h2>
            <p className="text-sm text-muted-foreground">{t(`landing.${id}.body`)}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
