"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <Link href="/">
        <img src="/duffle%20logo.webp" alt="Duffle" className="h-20 w-auto" />
      </Link>
      <div className="grid gap-2">
        <h1 className="text-balance text-3xl font-semibold tracking-tight">Something went wrong.</h1>
        <p className="text-balance text-muted-foreground">The page could not be loaded. Try it again.</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/" />}>
          Go home
        </Button>
      </div>
    </main>
  );
}
