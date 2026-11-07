"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { ClosetCard, type ClosetDraft } from "@/components/closet-item";
import { Field, Select } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { CLOTHING_SLOT_GROUPS, slotLabel, type ClothingSlot } from "@/lib/constants";
import { ClothingSlotIcon, slotColor } from "@/lib/tag-meta";
import { cn } from "@/lib/utils";

const OTHER_LABELS: Partial<Record<ClothingSlot, string>> = {
  OUTER: "Outerwear",
  ACCESSORY: "Accessories",
};

const closetSections = CLOTHING_SLOT_GROUPS.flatMap((group) => {
  if (group.label !== "Other") return [{ label: group.label, iconSlot: group.slots[0], slots: group.slots }];
  return group.slots.map((slot) => ({
    label: OTHER_LABELS[slot] ?? slotLabel(slot),
    iconSlot: slot,
    slots: [slot] as readonly ClothingSlot[],
  }));
});

export function ClosetBoard({ items }: { items: ClosetDraft[] }) {
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
            slotLabel(item.slot).toLowerCase().includes(needle)
          );
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Search" className="min-w-0 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground sm:left-2.5" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or description"
              className="pl-9 sm:pl-8"
            />
          </div>
        </Field>
        <Field label="Type" className="sm:w-56">
          <Select value={slot} onChange={(event) => setSlot(event.target.value)}>
            <option value="">All types</option>
            {CLOTHING_SLOT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.slots.map((option) => (
                  <option key={option} value={option}>
                    {slotLabel(option)}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{items.length === 0 ? "No items yet." : "No items match."}</p>
      ) : (
        visible.map((section) => (
          <section key={section.label} className="grid gap-3">
            <h2 className="flex items-center gap-2 text-lg font-medium">
              <span
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-full",
                  slotColor(section.iconSlot),
                )}
              >
                <ClothingSlotIcon slot={section.iconSlot} className="size-4" />
              </span>
              {section.label}
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
