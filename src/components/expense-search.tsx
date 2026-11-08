"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ExpenseCategoryIcon } from "@/components/expense-category";
import { Money } from "@/components/money-view";
import { cn } from "@/lib/utils";

export type ExpenseSearchEntry = {
  id: string;
  /** What the row shows as its title ("Dinner at Tasca", "You paid Sam"). */
  title: string;
  category: string;
  categoryLabel: string;
  dateLabel: string;
  /** In the trip's base currency. */
  amount: number;
  /** The original amount when it was in another currency ("€42.00"). */
  original: string | null;
  paidBy: string;
  people: string[];
  notes: string | null;
};

const LIMIT = 20;
const FLASH_MS = 3000;

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Every word typed has to appear somewhere in the expense; title matches rank first. */
function search(entries: ExpenseSearchEntry[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored: { entry: ExpenseSearchEntry; score: number }[] = [];
  for (const entry of entries) {
    const title = normalize(entry.title);
    const haystack = normalize(
      [
        entry.title,
        entry.categoryLabel,
        entry.dateLabel,
        entry.paidBy,
        ...entry.people,
        entry.notes ?? "",
        entry.original ?? "",
        entry.amount.toFixed(2),
      ].join(" "),
    );
    if (!words.every((word) => haystack.includes(word))) continue;
    const score = title.startsWith(words[0]) ? 0 : words.every((word) => title.includes(word)) ? 1 : 2;
    scored.push({ entry, score });
  }
  // Stable sort keeps the list's order (newest first) within a score.
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, LIMIT)
    .map(({ entry }) => entry);
}

/** Scrolls to an expense row and lights it up for a few seconds. */
function revealExpense(id: string) {
  const row = document.querySelector<HTMLElement>(`[data-expense-id="${CSS.escape(id)}"]`);
  if (!row) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  row.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  row.removeAttribute("data-flash");
  // Restart the highlight if the same row is picked again while it's still lit.
  void row.offsetWidth;
  row.setAttribute("data-flash", "");
  window.clearTimeout(Number(row.dataset.flashTimer));
  row.dataset.flashTimer = String(
    window.setTimeout(() => {
      row.removeAttribute("data-flash");
    }, FLASH_MS),
  );
}

export function ExpenseSearch({ entries }: { entries: ExpenseSearchEntry[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => search(entries, query), [entries, query]);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Combobox.Root<ExpenseSearchEntry>
      items={entries}
      filteredItems={results}
      value={null}
      inputValue={query}
      onInputValueChange={(next, details) => {
        // Picking a result clears the field instead of filling it with the title.
        if (details.reason !== "item-press") setQuery(next);
      }}
      onValueChange={(entry) => {
        if (!entry) return;
        setQuery("");
        inputRef.current?.blur();
        // Once the popup has closed, so the page doesn't scroll while it's still in the way.
        window.setTimeout(() => revealExpense(entry.id), 50);
      }}
      itemToStringLabel={(entry) => entry.title}
      isItemEqualToValue={(item, value) => item.id === value.id}
      autoHighlight
    >
      <Combobox.InputGroup
        className={cn(
          "relative flex h-11 w-full items-center rounded-lg border border-input bg-transparent text-base sm:h-9 sm:text-sm",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        )}
      >
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
        <Combobox.Input
          ref={inputRef}
          aria-label="Search expenses"
          placeholder="Search expenses by name, category, person or amount"
          autoComplete="off"
          className="h-full w-full min-w-0 bg-transparent pr-9 pl-9 outline-none placeholder:text-muted-foreground"
        />
        {query ? (
          <Combobox.Clear
            aria-label="Clear search"
            className="absolute right-1.5 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </Combobox.Clear>
        ) : null}
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner className="z-50 outline-none" sideOffset={6}>
          <Combobox.Popup
            className={cn(
              "max-h-[min(var(--available-height),24rem)] w-(--anchor-width) max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none",
              !query.trim() && "hidden",
            )}
          >
            <Combobox.Empty>
              <p className="px-3 py-2.5 text-muted-foreground">No expenses match “{query.trim()}”.</p>
            </Combobox.Empty>
            <Combobox.List>
              {(entry: ExpenseSearchEntry) => (
                <Combobox.Item
                  key={entry.id}
                  value={entry}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 outline-none select-none data-highlighted:bg-accent"
                >
                  <ExpenseCategoryIcon category={entry.category} />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate font-medium">{entry.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {entry.dateLabel} · {entry.categoryLabel} · {entry.paidBy}
                    </span>
                  </span>
                  <span className="grid shrink-0 justify-items-end gap-0.5">
                    <Money amount={entry.amount} className="font-medium tabular-nums" />
                    {entry.original ? (
                      <span className="text-xs text-muted-foreground tabular-nums">{entry.original}</span>
                    ) : null}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
