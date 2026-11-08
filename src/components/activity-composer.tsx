"use client";

import { Plus } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { useT } from "@/i18n/client";

export function ActivityComposer({ destination, children }: { destination: string; children: React.ReactNode }) {
  const t = useT("schedule");
  return (
    <FormDialog
      title={t("form.addActivityIn", { place: destination })}
      triggerLabel={t("form.addActivity")}
      triggerIcon={<Plus />}
      triggerVariant="outline"
      triggerClassName="w-full sm:w-fit"
    >
      {children}
    </FormDialog>
  );
}
