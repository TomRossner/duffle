import { Globe2, NotebookPen, PlaneTakeoff, Sparkles, Wallet } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { CountriesPicker } from "@/components/countries-picker";
import { CurrencySelect, Field } from "@/components/fields";
import { TripDatesFields } from "@/components/trip-dates-fields";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTrip } from "@/lib/actions/trips";

function FormSection({
  id,
  icon: Icon,
  title,
  hint,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-labelledby={id} className="grid gap-4 border-t pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="grid gap-0.5">
          <h2 id={id} className="text-sm font-semibold">
            {title}
          </h2>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function NewTripPage() {
  return (
    <div className="mx-auto grid w-full max-w-xl gap-6 py-4 sm:py-8">
      <header className="grid gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Plan a new trip</h1>
        <p className="text-sm text-muted-foreground">
          Start with the essentials. You can change any of this later and invite travelers once the trip exists.
        </p>
      </header>

      <Card className="shadow-lg shadow-primary/5">
        <CardContent className="px-5 py-2 sm:px-8 sm:py-4">
          <ActionForm action={createTrip} submitLabel="Create trip" submitIcon={<PlaneTakeoff />} className="grid gap-6">
            <FormSection id="trip-basics" icon={Sparkles} title="The basics" hint="What you'll call it and when it happens.">
              <Field label="Trip name">
                <Input name="name" placeholder="Summer in Lisbon" minLength={2} autoComplete="off" autoFocus required />
              </Field>
              <TripDatesFields />
            </FormSection>

            <FormSection
              id="trip-countries"
              icon={Globe2}
              title="Where you're headed"
              hint="Add every country on the route. Optional."
            >
              <CountriesPicker />
            </FormSection>

            <FormSection
              id="trip-money"
              icon={Wallet}
              title="Money"
              hint="Expenses in other currencies are converted to this one for totals and balances."
            >
              <Field label="Base currency">
                <CurrencySelect name="baseCurrency" withSymbols />
              </Field>
            </FormSection>

            <FormSection
              id="trip-note"
              icon={NotebookPen}
              title="Note"
              hint="A line for the trip card: the occasion, the mood, the plan. Optional."
            >
              <Textarea
                name="coverNote"
                rows={3}
                aria-labelledby="trip-note"
                placeholder="Anniversary trip, mostly beaches and long lunches."
              />
            </FormSection>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
