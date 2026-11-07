"use client";

import { Plus } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";

export function ActivityComposer({ destination, children }: { destination: string; children: React.ReactNode }) {
  return (
    <FormDialog
      title={`Add an activity in ${destination}`}
      triggerLabel="Add activity"
      triggerIcon={<Plus />}
      triggerVariant="outline"
      triggerClassName="w-full sm:w-fit"
    >
      {children}
    </FormDialog>
  );
}
