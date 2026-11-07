import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import { GoogleSignIn } from "@/components/google-sign-in";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared layout for the sign-in and create-account pages. */
export function AuthShell({
  title,
  description,
  callbackUrl,
  wide = false,
  notices,
  footer,
  children,
}: {
  title: string;
  description: string;
  callbackUrl?: string;
  /** A wider card, for longer forms. */
  wide?: boolean;
  /** Messages shown above the sign-in options. */
  notices?: React.ReactNode;
  /** The link to the other page, under the card. */
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh w-full justify-center overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background px-4 py-8 sm:items-center sm:py-12">
      <div className={cn("relative grid w-full content-start gap-6", wide ? "max-w-xl" : "max-w-md")}>
        <Link href="/" className="justify-self-center" aria-label="Duffle home">
          <img src="/duffle%20logo.webp" alt="Duffle" className="h-16 w-auto sm:h-20" />
        </Link>
        <Card className="w-full shadow-lg shadow-primary/5">
          <CardContent className="grid gap-6 px-5 py-2 sm:px-8 sm:py-4">
            <div className="grid gap-1.5 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {notices}
            <GoogleSignIn callbackUrl={callbackUrl} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground" role="separator">
              <span className="h-px flex-1 bg-border" />
              or continue with email
              <span className="h-px flex-1 bg-border" />
            </div>
            {children}
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  );
}

export function AuthNotice({ tone = "info", children }: { tone?: "info" | "error"; children: React.ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
        tone === "error" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-foreground",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

/** A small heading that splits a long form into sections. */
export function AuthSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
