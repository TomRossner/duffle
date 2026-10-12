"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProfilePhotoField() {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="grid gap-1.5">
      <span className="text-sm leading-none font-medium">Profile picture</span>
      <label className="flex min-w-0 flex-wrap items-center gap-3">
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? null)}
        />
        <span className={cn(buttonVariants({ variant: "outline" }))}>
          {fileName ? "Change photo" : "Choose photo"}
        </span>
        <span className="min-w-0 text-sm break-all text-muted-foreground">
          {fileName ?? "JPEG, PNG, WebP, or GIF. Up to 5MB."}
        </span>
      </label>
    </div>
  );
}
