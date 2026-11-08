"use client";

import { HandCoins, ReceiptText } from "lucide-react";
import { ExpenseForm } from "@/components/expense-form";
import { FormDialog } from "@/components/form-dialog";
import { SettlementForm } from "@/components/settlement-form";
import { useT } from "@/i18n/client";

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
  return (
    <FormDialog title={label} description={description} icon={<ReceiptText />} triggerClassName="w-full sm:w-fit" wide>
      <ExpenseForm action={action} members={members} currency={currency} submitLabel={submitLabel} />
    </FormDialog>
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
  const t = useT("money");
  return (
    <FormDialog
      title={t("panel.recordTitle")}
      description={t("panel.recordDescription")}
      icon={<HandCoins />}
      triggerVariant="secondary"
      triggerClassName="w-full sm:w-fit"
    >
      <SettlementForm tripId={tripId} members={members} currency={currency} />
    </FormDialog>
  );
}
