import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found · Duffle",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <Link href="/">
        <img src="/duffle%20logo.webp" alt="Duffle" loading="lazy" className="h-20 w-auto" />
      </Link>
      <div className="grid gap-2">
        <p className="font-mono text-sm tracking-widest text-muted-foreground">404</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">This page isn&apos;t on the map.</h1>
        <p className="text-balance text-muted-foreground">
          The link may be out of date, or the page may have been removed.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/" />}>
        Go home
      </Button>
    </main>
  );
}
