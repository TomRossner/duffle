"use client";

import { useT } from "@/i18n/client";
import type { Messages } from "@/i18n/messages/en";

export type LabelGroup = keyof Messages["labels"];

/** An enum value's label in the page's language: <LabelText group="planKinds" id="FLIGHT" />. */
export function LabelText({ group, id, fallback }: { group: LabelGroup; id: string; fallback?: string }) {
  const t = useT("labels");
  return <>{t.dynamic(`${group}.${id}`, undefined, fallback ?? id)}</>;
}
