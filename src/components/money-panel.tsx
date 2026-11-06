"use client";

import { useState } from "react";
import { ExpenseForm } from "@/components/expense-form";
import { SettlementForm } from "@/components/settlement-form";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Member = { id: string; name: string; imageKey?: string | null };

type Action = (
  state: { error?: string; ok?: boolean } | null | undefined,
  formData: FormData,
) => Promise<{ error?: string; ok?: boolean } | null | undefined>;

export function ExpenseFormToggle({
  label,
  description,
  action,
  members,
  currency,
  submitLabel,
}: {
  label: string;
  description: string;
  action: Action;
  members: Member[];
  currency: string;
  submitLabel: string;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button type="button" className="sm:w-fit" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <Card className="col-span-2 w-full">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ExpenseForm
          action={action}
          members={members}
          currency={currency}
          submitLabel={submitLabel}
          onSaved={() => setOpen(false)}
        />
      </CardContent>
    </Card>
  );
}

export function SettlementFormToggle({
  tripId,
  members,
  currency,
}: {
  tripId: string;
  members: { id: string; name: string }[];
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button type="button" className="sm:w-fit" onClick={() => setOpen(true)}>
        Record a payment
      </Button>
    );
  }

  return (
    <Card className="col-span-2 w-full">
      <CardHeader>
        <CardTitle>Record a payment</CardTitle>
        <CardDescription>Someone pays someone else to settle up.</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <SettlementForm tripId={tripId} members={members} currency={currency} onSaved={() => setOpen(false)} />
      </CardContent>
    </Card>
  );
}
