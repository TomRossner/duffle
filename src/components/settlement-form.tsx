"use client";

import { useActionState, useEffect } from "react";
import { CurrencyRateFields } from "@/components/currency-rate-fields";
import { Field, Select } from "@/components/fields";
import { useCloseFormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";
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
  const t = useT("money");
  const tCommon = useT("common");
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
        <Field label={t("form.from")}>
          <Select name="fromUserId" defaultValue={members[0]?.id}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("form.to")}>
          <Select name="toUserId" defaultValue={members[1]?.id ?? members[0]?.id}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("form.amount")}>
          <Input name="amount" type="number" min="0.01" step="0.01" required />
        </Field>
        <CurrencyRateFields defaultValue={currency} baseCurrency={currency} withSymbols />
        <Field label={t("form.date")}>
          <Input name="date" type="date" required />
        </Field>
      </div>
      {state && "error" in state ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? tCommon("saving") : t("form.recordPayment")}
      </Button>
    </form>
  );
}
