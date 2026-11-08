"use client";

import { Plus } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import { PlanForm } from "@/components/plan-form";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

type PlanFormProps = Omit<React.ComponentProps<typeof PlanForm>, "defaultDate" | "compact" | "open" | "onOpenChange">;

const AddPlanContext = createContext<((date: string) => void) | null>(null);

/**
 * One "Add a plan" form shared by every day of the schedule. Each day only has a small button that opens it
 * on that day, so a long trip doesn't carry a whole form per day.
 */
export function AddPlanProvider({ children, ...form }: PlanFormProps & { children: React.ReactNode }) {
  const [date, setDate] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const openFor = useCallback((day: string) => {
    setDate(day);
    setOpen(true);
  }, []);

  return (
    <AddPlanContext.Provider value={openFor}>
      {children}
      {date ? (
        // Keyed by day, so each opening starts from a fresh form with that day filled in.
        <PlanForm key={date} {...form} defaultDate={date} compact open={open} onOpenChange={setOpen} />
      ) : null}
    </AddPlanContext.Provider>
  );
}

export function AddPlanButton({ date, className }: { date: string; className?: string }) {
  const open = useContext(AddPlanContext);
  const t = useT("schedule");
  if (!open) return null;
  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={() => open(date)}>
      <Plus />
      {t("form.addPlan")}
    </Button>
  );
}
