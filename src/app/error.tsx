"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT("common");
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <Link href="/">
        <img src="/duffle%20logo.webp" alt="Duffle" className="h-20 w-auto" />
      </Link>
      <div className="grid gap-2">
        <h1 className="text-balance text-3xl font-semibold tracking-tight">{t("error.heading")}</h1>
        <p className="text-balance text-muted-foreground">{t("error.body")}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={() => reset()}>
          {t("tryAgain")}
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/" />}>
          {t("goHome")}
        </Button>
      </div>
    </main>
  );
}
