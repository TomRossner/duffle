"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { ClosetCard, useSlotLabels, type ClosetDraft } from "@/components/closet-item";
import { Field, Select } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { CLOTHING_SLOT_GROUPS, type ClothingSlot } from "@/lib/constants";
import { ClothingSlotIcon, slotColor } from "@/lib/tag-meta";
import { cn } from "@/lib/utils";

const OTHER_LABELS = { OUTER: "board.outerwear", ACCESSORY: "board.accessories" } as const;

/** Each group is a section, except "Other", whose types get a section each. */
const closetSections = CLOTHING_SLOT_GROUPS.flatMap((group) => {
  if (group.label !== "Other") return [{ id: group.label, group: true, iconSlot: group.slots[0], slots: group.slots }];
  return group.slots.map((slot) => ({
    id: slot as string,
    group: false,
    iconSlot: slot,
    slots: [slot] as readonly ClothingSlot[],
  }));
});

export function ClosetBoard({ items }: { items: ClosetDraft[] }) {
  const t = useT("closet");
  const labels = useSlotLabels();
  const sectionLabel = (section: (typeof closetSections)[number]) => {
    if (section.group) return labels.group(section.id);
    const other = OTHER_LABELS[section.id as keyof typeof OTHER_LABELS];
    return other ? t(other) : labels.slot(section.id);
  };
  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState("");
  const needle = query.trim().toLowerCase();

  const visible = closetSections
    .map((section) => ({
      ...section,
      items: section.slots
        .flatMap((sectionSlot) => items.filter((item) => item.slot === sectionSlot))
        .filter((item) => !slot || item.slot === slot)
        .filter((item) => {
          if (!needle) return true;
          return (
            item.name.toLowerCase().includes(needle) ||
            item.description.toLowerCase().includes(needle) ||
            labels.slot(item.slot).toLowerCase().includes(needle)
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label={t("board.search")} className="min-w-0 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:start-2.5" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("board.searchPlaceholder")}
              className="ps-9 sm:ps-8"
            />
          </div>
        </Field>
        <Field label={t("board.type")} className="sm:w-56">
          <Select value={slot} onChange={(event) => setSlot(event.target.value)}>
            <option value="">{t("board.allTypes")}</option>
            {CLOTHING_SLOT_GROUPS.map((group) => (
              <optgroup key={group.label} label={labels.group(group.label)}>
                {group.slots.map((option) => (
                  <option key={option} value={option}>
                    {labels.slot(option)}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{items.length === 0 ? t("board.empty") : t("board.noMatch")}</p>
      ) : (
        visible.map((section) => (
          <section key={section.id} className="grid gap-3">
            <h2 className="flex items-center gap-2 text-lg font-medium">
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-full",
                  slotColor(section.iconSlot),
                )}
              >
                <ClothingSlotIcon slot={section.iconSlot} className="size-4" />
              </span>
              {sectionLabel(section)}
              <span className="text-sm font-normal text-muted-foreground">{section.items.length}</span>
            </h2>
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <ClosetCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
