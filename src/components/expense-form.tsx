"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckBox } from "@/components/checkbox";
import { ExpenseCategoryPicker } from "@/components/expense-category";
import { CurrencyRateFields } from "@/components/currency-rate-fields";
import { Field, FieldGroup, Select } from "@/components/fields";
import { useCloseFormDialog } from "@/components/form-dialog";
import { MemberTag } from "@/components/member-tag";
import { SplitTypePicker } from "@/components/split-type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Member = { id: string; name: string; imageKey?: string | null };

type FormState = { error?: string; ok?: boolean } | null | undefined;

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export type ExpenseFormDefaults = {
  title: string;
  amount: string;
  currency: string;
  manualRate: string;
  date: string;
  category: string;
  paidById: string;
  splitType: string;
  participantIds: string[];
  shareAmounts: Record<string, string>;
  sharePercents: Record<string, string>;
  notes: string;
};

export function ExpenseForm({
  action,
  members,
  currency,
  submitLabel,
  includeCategory = true,
  defaultCategory = "OTHER",
  defaults,
  onSaved,
}: {
  action: Action;
  members: Member[];
  currency: string;
  submitLabel: string;
  includeCategory?: boolean;
  defaultCategory?: string;
  defaults?: ExpenseFormDefaults;
  onSaved?: () => void;
}) {
  const [splitType, setSplitType] = useState(defaults?.splitType ?? "EQUAL");
  const [selected, setSelected] = useState<string[]>(defaults?.participantIds ?? members.map((member) => member.id));
  const [state, formAction, pending] = useActionState(action, null);

  const closeDialog = useCloseFormDialog();
  useEffect(() => {
    if (!state?.ok) return;
    onSaved?.();
    closeDialog?.();
  }, [state, onSaved, closeDialog]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title">
          <Input name="title" defaultValue={defaults?.title} required />
        </Field>
        <Field label="Amount">
          <Input name="amount" type="number" min="0.01" step="0.01" defaultValue={defaults?.amount} required />
        </Field>
        <CurrencyRateFields
          defaultValue={defaults?.currency ?? currency}
          baseCurrency={currency}
          defaultRate={defaults?.manualRate}
          withSymbols
        />
        <Field label="Date">
          <Input name="date" type="date" defaultValue={defaults?.date} required />
        </Field>
        {includeCategory ? (
          <ExpenseCategoryPicker defaultValue={defaults?.category ?? defaultCategory} />
        ) : (
          <input type="hidden" name="category" value={defaultCategory} />
        )}
        <Field label="Paid by">
          <Select name="paidById" defaultValue={defaults?.paidById ?? members[0]?.id}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
        <FieldGroup label="Split">
          <SplitTypePicker name="splitType" value={splitType} onValueChange={setSplitType} />
        </FieldGroup>
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Travelers</legend>
        {members.map((member) => (
          <label key={member.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted py-1 pr-3 pl-1.5">
              <CheckBox
                name="participant"
                value={member.id}
                checked={selected.includes(member.id)}
                onChange={() => toggle(member.id)}
              />
              <MemberTag userId={member.id} name={member.name} imageKey={member.imageKey} />
            </span>
            {splitType === "EXACT" && selected.includes(member.id) ? (
              <Input
                name={`shareAmount:${member.id}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                className="max-w-32"
                defaultValue={defaults?.shareAmounts[member.id]}
              />
            ) : null}
            {splitType === "PERCENT" && selected.includes(member.id) ? (
              <Input
                name={`sharePercent:${member.id}`}
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="%"
                className="max-w-24"
                defaultValue={defaults?.sharePercents[member.id]}
              />
            ) : null}
          </label>
        ))}
      </fieldset>
      <Field label="Notes">
        <Textarea name="notes" rows={2} defaultValue={defaults?.notes} />
      </Field>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
