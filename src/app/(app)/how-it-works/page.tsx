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

export const metadata: Metadata = {
  title: "How it works · Duffle",
  description: "What each part of Duffle does and how to use it.",
};

type Feature = { icon: LucideIcon; title: string; body: string; points: string[] };

const steps: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Plus,
    title: "Create a trip",
    body: "Give it a name, dates, the countries you'll visit, and the currency the group budgets in.",
  },
  {
    icon: UserPlus,
    title: "Bring the group",
    body: "Invite people by email, or share a join link or QR code. Anyone with a Duffle account can join.",
  },
  {
    icon: MapPinned,
    title: "Plan it together",
    body: "Add destinations, flights, stays and activities. Everyone on the trip works from the same plan.",
  },
  {
    icon: Luggage,
    title: "Pack and go",
    body: "Check the forecast, attach your documents, and pack from your closet with suggestions for the weather.",
  },
];

const tripSections: Feature[] = [
  {
    icon: Compass,
    title: "Overview",
    body: "The trip's home page: dates, countries, the people going, and the trip details.",
    points: [
      "Admins can edit the trip details, invite travelers, and delete the trip.",
      "Pending invites show up on your Trips page until you accept or decline them.",
    ],
  },
  {
    icon: Map,
    title: "Map",
    body: "Destinations with their dates, notes, and activities, pinned on a shared map.",
    points: [
      "Search a place by name to pin it. Duffle looks it up on Google Maps.",
      "Add activities to a destination and tag them so they're easy to scan.",
    ],
  },
  {
    icon: CloudSun,
    title: "Weather",
    body: "A daily forecast for each destination: temperature, rain, wind and conditions.",
    points: [
      "Upcoming dates use the forecast, and past dates use recorded weather.",
      "Packing suggestions use the same forecast.",
    ],
  },
  {
    icon: CalendarDays,
    title: "Schedule",
    body: "Every day of the trip as a list or a calendar, with flights and plans in order.",
    points: [
      "Plans can have times, places, notes and tags, run all day, or repeat on chosen weekdays.",
      "Type a flight number and date and Look up fills in the airline, airports, terminals and times. A flight with a stop adds each leg.",
      "Duffle keeps checking upcoming flights and notifies everyone on board when times or terminals change.",
    ],
  },
  {
    icon: BedDouble,
    title: "Stays",
    body: "Hotels and rentals with check-in and check-out dates, the address, and the confirmation number.",
    points: ["Link each stay to a destination so it sits with the rest of that stop."],
  },
  {
    icon: Wallet,
    title: "Money",
    body: "Shared expenses, balances, and budget sheets in the trip's currency.",
    points: [
      "Add an expense, choose who paid, and split it equally, by exact amounts, or by percent.",
      "Pay in another currency and Duffle converts it at the exchange rate.",
      "Record a payment when someone settles up, and the balances update.",
      "Budget sheets plan flights, lodging, cars and anything else. Import them from Excel, and turn a row into a real expense once it's paid.",
    ],
  },
  {
    icon: FileImage,
    title: "Documents",
    body: "Tickets, bookings and other files for the whole group, plus personal documents travelers attach.",
    points: ["Your passport and ID are shared with the group only when you attach them to this trip."],
  },
  {
    icon: Shield,
    title: "Insurance",
    body: "Each traveler's policy: insurer, dates, policy number, cost and the policy file.",
    points: ["Upload the policy and Duffle reads the provider, dates, number and premium for you."],
  },
  {
    icon: Luggage,
    title: "Packing",
    body: "Your bags and what goes in each one, plus a shared list for the group.",
    points: [
      "Suggest clothes picks items from your closet that fit the forecast and the plans for each day, and explains why.",
      "Drag items between bags and tick them off as you pack.",
      "The shared list is for things the group brings together. Everyone ticks off their own copy.",
    ],
  },
];

const accountSections: Feature[] = [
  {
    icon: Shirt,
    title: "Closet",
    body: "The clothes and gear you own, with the temperatures, weather and activities each piece is for.",
    points: [
      "Upload a photo and Duffle fills in the item for you.",
      "Your closet follows you to every trip and powers packing suggestions.",
    ],
  },
  {
    icon: IdCard,
    title: "Documents",
    body: "Passports, IDs and licenses stay on your account, private to you.",
    points: [
      "Upload a photo or PDF and Duffle reads the name, number and dates.",
      "Attach a document to a trip only when that trip needs it.",
    ],
  },
  {
    icon: Bell,
    title: "Notifications",
    body: "The bell shows trip changes, new expenses, invites and flight updates.",
    points: ["Turn on push alerts in the panel to get them even when Duffle isn't open."],
  },
  {
    icon: UserRound,
    title: "Profile",
    body: "Your photo, contact details and home country.",
    points: ["Your home country is used for the destination flags on your trips."],
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <article className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <h3 className="text-base font-semibold">{feature.title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{feature.body}</p>
      <ul className="grid gap-1.5 text-sm">
        {feature.points.map((point) => (
          <li key={point} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
            {point}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="grid gap-10">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">How Duffle works</h1>
        <p className="max-w-2xl text-muted-foreground">
          Duffle keeps a whole trip in one place for everyone going: the plan, the weather, the money, the documents
          and the packing. Here&apos;s what each part does.
        </p>
      </header>

      <section aria-labelledby="getting-started" className="grid gap-4">
        <h2 id="getting-started" className="text-lg font-semibold">
          Getting started
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex flex-col gap-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-3xl font-semibold text-muted-foreground/40 tabular-nums">{index + 1}</span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="inside-a-trip" className="grid gap-4">
        <div className="grid gap-1">
          <h2 id="inside-a-trip" className="text-lg font-semibold">
            Inside a trip
          </h2>
          <p className="text-sm text-muted-foreground">Each trip has these tabs. Everyone on the trip can see and edit them.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tripSections.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      <section aria-labelledby="your-account" className="grid gap-4">
        <div className="grid gap-1">
          <h2 id="your-account" className="text-lg font-semibold">
            On your account
          </h2>
          <p className="text-sm text-muted-foreground">These belong to you and come with you to every trip.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {accountSections.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start gap-4 rounded-xl bg-primary/5 p-5 ring-1 ring-primary/15 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm">
            <span className="font-medium">Reading files for you.</span>{" "}
            <span className="text-muted-foreground">
              Wherever you upload a document, policy, closet photo or Excel sheet, Duffle fills in the form for you.
              Check what it read before you save.
            </span>
          </p>
        </div>
        <Button nativeButton={false} className="w-full shrink-0 sm:w-auto" render={<Link href="/trips" />}>
          Go to my trips
        </Button>
      </section>
    </div>
  );
}
