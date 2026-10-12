import Link from "next/link";
import { IdCard, Luggage, MapPinned } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";
import { NotificationBell } from "@/components/notification-bell";
import { SignOutButton } from "@/components/sign-out-button";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, imageKey: true },
  });
  if (!user) return null;

  return (
    <div className="min-h-full bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/trips" aria-label="Duffle" className="inline-flex shrink-0 items-center">
            <img src="/duffle%20logo.webp" alt="" className="h-10 w-auto sm:h-12" />
          </Link>
          <nav className="order-last flex w-full items-center gap-4 text-sm sm:order-none sm:w-auto">
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
            <SignOutButton />
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
