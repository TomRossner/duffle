"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ActivityComposer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Add activity
      </Button>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl bg-muted/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">New activity</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
      {children}
    </div>
  );
}
