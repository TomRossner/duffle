import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/lib/trip-access";

export default async function HomePage() {
  const user = await currentUser();
  if (user) redirect("/trips");

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-8 px-6 py-20">
      <div className="grid gap-3">
        <img src="/duffle%20logo.webp" alt="Duffle" className="h-24 w-auto sm:h-28" />
        <h1 className="text-4xl font-semibold tracking-tight">One place for the whole trip.</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Share a trip with the people going. Keep the map, weather, schedule, documents, insurance,
          packing list, and who owes what together.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/register" />}>
          Create an account
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/login" />}>
          Sign in
        </Button>
      </div>
    </div>
  );
}
