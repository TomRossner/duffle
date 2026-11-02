import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CloudSun, FileText, Luggage, MapPinned, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/trip-access";

const features = [
  { icon: MapPinned, title: "Map", body: "Every stop, pinned and shared." },
  { icon: CalendarDays, title: "Schedule", body: "One itinerary everyone can see." },
  { icon: CloudSun, title: "Weather", body: "Forecasts for where you're headed." },
  { icon: FileText, title: "Documents", body: "Passports, tickets, and insurance." },
  { icon: Luggage, title: "Packing", body: "Lists built from your closet." },
  { icon: Wallet, title: "Expenses", body: "Track who owes what." },
];

export default async function HomePage() {
  const user = await currentUser();
  if (user) redirect("/trips");

  return (
    <main className="mx-auto flex w-full flex-1 max-w-4xl flex-col justify-center gap-12 px-6 pt-6 pb-16 sm:pt-10 sm:pb-24">
      <section className="flex flex-col items-center gap-5 text-center sm:items-start sm:text-left">
        <img src="/duffle%20logo.webp" alt="Duffle" className="h-20 w-auto sm:h-28" />
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          One place for the whole trip.
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">
          Share a trip with the people going. Keep the map, weather, schedule, documents, insurance,
          packing list, and who owes what together.
        </p>
        <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button nativeButton={false} size="lg" className="w-full sm:w-auto" render={<Link href="/register" />}>
            Create an account
          </Button>
          <Button
            nativeButton={false}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
            render={<Link href="/login" />}
          >
            Sign in
          </Button>
        </div>
      </section>

      <section aria-label="Features" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 text-center ring-1 ring-foreground/10 sm:items-start sm:text-left"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <h2 className="text-sm font-medium">{title}</h2>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
