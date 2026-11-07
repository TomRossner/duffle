"use client";

import { useActionState, useEffect } from "react";
import { CurrencySelect, Field, Select } from "@/components/fields";
import { useCloseFormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSettlement } from "@/lib/actions/expenses";

export function SettlementForm({
  tripId,
  members,
  currency,
  onSaved,
}: {
  tripId: string;
  members: { id: string; name: string }[];
  currency: string;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createSettlement.bind(null, tripId), null);

  const closeDialog = useCloseFormDialog();
  useEffect(() => {
    if (!(state && "ok" in state && state.ok)) return;
    onSaved?.();
    closeDialog?.();
  }, [state, onSaved, closeDialog]);

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From">
          <Select name="fromUserId" defaultValue={members[0]?.id}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="To">
          <Select name="toUserId" defaultValue={members[1]?.id ?? members[0]?.id}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount">
          <Input name="amount" type="number" min="0.01" step="0.01" required />
        </Field>
        <Field label="Currency">
          <CurrencySelect defaultValue={currency} withSymbols />
        </Field>
        <Field label="Date">
          <Input name="date" type="date" required />
        </Field>
        <Field label="Manual rate">
          <Input name="manualRate" type="number" min="0" step="0.0001" placeholder="Optional" />
        </Field>
      </div>
      {state && "error" in state ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Record payment"}
      </Button>
    </form>
  );
}
