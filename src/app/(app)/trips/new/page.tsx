import { ActionForm } from "@/components/action-form";
import { CountriesPicker } from "@/components/countries-picker";
import { CurrencySelect, Field, FieldGroup } from "@/components/fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTrip } from "@/lib/actions/trips";

export default function NewTripPage() {
  return (
    <div className="flex justify-center py-6 sm:py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>New trip</CardTitle>
          <CardDescription>Set the dates, where you&apos;re headed, and how the trip&apos;s money is tracked. You can change these later.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm action={createTrip} submitLabel="Create trip">
            <Field label="Name">
              <Input name="name" required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start">
                <Input name="startDate" type="date" required />
              </Field>
              <Field label="End">
                <Input name="endDate" type="date" required />
              </Field>
            </div>
            <FieldGroup label="Countries you'll visit">
              <CountriesPicker />
            </FieldGroup>
            <Field label="Base currency">
              <CurrencySelect name="baseCurrency" withSymbols />
            </Field>
            <Field label="Note">
              <Textarea name="coverNote" rows={3} />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
