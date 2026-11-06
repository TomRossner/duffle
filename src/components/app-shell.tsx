import Link from "next/link";
import { after } from "next/server";
import { IdCard, Luggage, MapPinned } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { SignOutButton } from "@/components/sign-out-button";
import { refreshUpcomingFlights } from "@/lib/flight-refresh";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, imageKey: true },
  });
  if (!user) return null;
  // Once the page is sent, check the traveler's upcoming flights for airline changes (throttled inside).
  after(() =>
    refreshUpcomingFlights(user.id).catch((error) => console.error("[flight-refresh] Failed:", error)),
  );

  return (
    <div className="min-h-full bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:gap-x-4">
          <MobileNav
            signedIn
            signOut={
              <SignOutButton
                label="Log out"
                className="h-auto w-full justify-start gap-4 rounded-xl border-0 px-5 py-4 text-lg font-normal [&_svg]:size-6"
              />
            }
          />
          <Link href="/trips" aria-label="Duffle" className="inline-flex shrink-0 items-center gap-2">
            <img src="/duffle-bag.webp" alt="" className="h-8 w-auto -translate-y-0.5 sm:h-10 sm:translate-y-0" />
            <span className="text-xl font-bold tracking-tight text-[#234570] sm:hidden">Duffle</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            <Link href="/trips" className="inline-flex items-center gap-1.5 hover:text-primary">
              <MapPinned className="size-4" />
              Trips
            </Link>
            <Link href="/closet" className="inline-flex items-center gap-1.5 hover:text-primary">
              <Luggage className="size-4" />
              Closet
            </Link>
            <Link href="/documents" className="inline-flex items-center gap-1.5 hover:text-primary">
              <IdCard className="size-4" />
              Documents
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <Link href="/profile" className="inline-flex min-w-0 items-center gap-2 text-sm hover:text-primary">
              <Avatar name={user.name} userId={user.id} imageKey={user.imageKey} />
              <span className="hidden max-w-40 truncate sm:inline">{user.name}</span>
            </Link>
            <div className="hidden sm:block">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:py-8">
        <BackButton />
        {children}
      </main>
    </div>
  );
}
