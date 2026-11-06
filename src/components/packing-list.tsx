"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Check, CloudSun, EllipsisVertical, GripVertical, Luggage, Pencil, Plus, Shirt, Sparkles, Trash2, Users, X } from "lucide-react";
import { useActionState, useEffect, useId, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { CheckBox } from "@/components/checkbox";
import { CheckList, Field, Select } from "@/components/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addClosetItems,
  clearLuggageItems,
  createLuggage,
  createPackingItem,
  createSharedPackingItem,
  deleteLuggage,
  deletePackingItem,
  deleteSharedPackingItem,
  movePackingItem,
  setPackingItemPacked,
  setSharedPackingChecked,
  updateLuggage,
  updatePackingItem,
  updateSharedPackingItem,
} from "@/lib/actions/packing-list";
import {
  CATEGORY_COLORS,
  KIND_COLORS,
  LuggageKindIcon,
  PackingCategoryIcon,
  categoryLabel,
  luggageLabel,
} from "@/lib/packing-meta";
import {
  LUGGAGE_KINDS,
  LUGGAGE_LABELS,
  PACKING_CATEGORIES,
  CATEGORY_LABELS,
  categoryForSlot,
  isPackingCategory,
} from "@/lib/packing-list";
import { ClothingSlotIcon } from "@/lib/tag-meta";
import {
  SUGGEST_CLOTHES_STEP_LABELS,
  isSuggestClothesStep,
  type SuggestClothesStep,
} from "@/lib/suggest-clothes-steps";
import { cn } from "@/lib/utils";

export type PackingListItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  packed: boolean;
  closetItemId: string | null;
  slot: string | null;
  note: string | null;
};

export type PackingBag = {
  id: string;
  name: string;
  kind: string;
  items: PackingListItem[];
};

export type ClosetOption = {
  id: string;
  name: string;
  slot: string;
};

export type SharedListItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  packed: boolean;
  packedCount: number;
};

export type SharedTraveler = {
  id: string;
  name: string;
  packed: number;
};

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-accent";

const PACKING_DRAG = "application/x-packing-item";

let activeDrag: { itemId: string; fromBagId: string } | null = null;

function moveItemBetweenBags(current: PackingBag[], move: { itemId: string; toBagId: string }) {
  const source = current.find((bag) => bag.items.some((item) => item.id === move.itemId));
  const moved = source?.items.find((item) => item.id === move.itemId);
  if (!source || !moved || source.id === move.toBagId) return current;
  return current.map((bag) => {
    if (bag.id === source.id) return { ...bag, items: bag.items.filter((item) => item.id !== move.itemId) };
    if (bag.id === move.toBagId) return { ...bag, items: [...bag.items, moved] };
    return bag;
  });
}

export function PackingBoard({
  tripId,
  bags,
  closet,
  sharedItems,
  travelers,
  dev = false,
}: {
  tripId: string;
  bags: PackingBag[];
  closet: ClosetOption[];
  sharedItems: SharedListItem[];
  travelers: SharedTraveler[];
  dev?: boolean;
}) {
  const [optimisticBags, applyMove] = useOptimistic(bags, moveItemBetweenBags);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [, startMove] = useTransition();
  const packed = optimisticBags.reduce((sum, bag) => sum + bag.items.filter((item) => item.packed).length, 0);
  const total = optimisticBags.reduce((sum, bag) => sum + bag.items.length, 0);
  const usedClosetIds = new Set(
    optimisticBags.flatMap((bag) => bag.items.map((item) => item.closetItemId).filter((id): id is string => Boolean(id))),
  );

  function onMove(itemId: string, toBagId: string) {
    const source = optimisticBags.find((bag) => bag.items.some((item) => item.id === itemId));
    if (!source || source.id === toBagId) return;
    setMoveError(null);
    startMove(async () => {
      applyMove({ itemId, toBagId });
      const result = await movePackingItem(tripId, itemId, toBagId);
      if (result && "error" in result && result.error) setMoveError(result.error);
    });
  }

  return (
    <div className="grid gap-6">
      <SharedList tripId={tripId} items={sharedItems} bags={optimisticBags} travelers={travelers} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Your bags</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            These stay private. Split what you are bringing across packs, bags, trolleys, and luggage. Drag an item by
            its handle to move it to another bag, and check items off as they go in.
          </p>
          {total > 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {packed} of {total} packed
            </p>
          ) : null}
          {moveError ? <p className="mt-1 text-sm text-destructive">{moveError}</p> : null}
        </div>
        <SuggestClothes tripId={tripId} bags={bags} />
      </div>
      {bags.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            Add a pack, bag, trolley, or piece of luggage, then fill it from your closet or with anything else you need.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          {optimisticBags.map((bag) => (
            <BagCard
              key={bag.id}
              tripId={tripId}
              bag={bag}
              bags={optimisticBags}
              closet={closet.filter((item) => !usedClosetIds.has(item.id))}
              dev={dev}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function SharedList({
  tripId,
  items,
  bags,
  travelers,
}: {
  tripId: string;
  items: SharedListItem[];
  bags: PackingBag[];
  travelers: SharedTraveler[];
}) {
  const [adding, setAdding] = useState(false);
  const [bagId, setBagId] = useState(bags[0]?.id ?? "");
  const selectedBagId = bags.some((bag) => bag.id === bagId) ? bagId : (bags[0]?.id ?? "");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid min-w-0 gap-1">
          <CardTitle className="flex items-center gap-2">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-4" />
            </span>
            Everyone should bring
          </CardTitle>
          <CardDescription className="max-w-2xl">
            A reminder for the whole trip. Anyone can add an item. Checking one packs your own copy
            {bags.length > 0 ? " into the bag you choose" : " into a new day pack"} and leaves everyone else unchecked.
          </CardDescription>
        </div>
        <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={() => setAdding(true)}>
          <Plus data-icon="inline-start" />
          Add an item
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {(items.length > 0 && travelers.length > 0) || bags.length > 1 ? (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            {items.length > 0 && travelers.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Packing progress">
                {travelers.map((traveler) => {
                  const done = traveler.packed >= items.length;
                  return (
                    <li key={traveler.id} className="grid min-w-32 flex-1 gap-1.5 rounded-lg bg-muted/50 px-3 py-2 sm:flex-none">
                      <span className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-medium">{firstName(traveler.name)}</span>
                        <span className={cn("shrink-0 text-muted-foreground tabular-nums", done && "text-primary")}>
                          {traveler.packed}/{items.length}
                        </span>
                      </span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <span
                          className="block h-full rounded-full bg-primary transition-[width]"
                          style={{ width: `${Math.min(100, (traveler.packed / items.length) * 100)}%` }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {bags.length > 1 ? (
              <Field label="Add checked items to" className="w-full lg:ml-auto lg:w-56 lg:shrink-0">
                <Select value={selectedBagId} onChange={(event) => setBagId(event.target.value)}>
                  {bags.map((bag) => (
                    <option key={bag.id} value={bag.id}>
                      {bag.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </div>
        ) : null}
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing yet. Add a passport, rain jacket, charger, or anything else each person should pack.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
            {items.map((item) => (
              <SharedRow key={item.id} tripId={tripId} item={item} bagId={selectedBagId} travelerCount={travelers.length} />
            ))}
          </ul>
        )}
      </CardContent>
      <EditorDialog
        open={adding}
        onOpenChange={setAdding}
        title="Add to the shared list"
        description="Everyone on the trip sees this, and each person checks off their own copy."
      >
        <ActionForm action={createSharedPackingItem.bind(null, tripId)} submitLabel="Add item" onSaved={() => setAdding(false)}>
          <ItemFields category="OTHER" quantity={1} />
        </ActionForm>
      </EditorDialog>
    </Card>
  );
}

function SharedRow({
  tripId,
  item,
  bagId,
  travelerCount,
}: {
  tripId: string;
  item: SharedListItem;
  bagId: string;
  travelerCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useOptimistic(item.packed, (_current, next: boolean) => next);
  const [, startTransition] = useTransition();

  return (
    <li
      className={cn(
        "grid gap-1 rounded-lg border bg-card py-1.5 pr-1 pl-2.5 transition-colors hover:bg-muted/40",
        optimistic && "bg-muted/30",
      )}
    >
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
          <CheckBox
            checked={optimistic}
            aria-label={`Pack ${item.name}`}
            onChange={() => {
              const next = !item.packed;
              setError(null);
              startTransition(async () => {
                setOptimistic(next);
                const result = await setSharedPackingChecked(tripId, item.id, next, bagId);
                if (result && "error" in result && result.error) setError(result.error);
              });
            }}
          />
          {isPackingCategory(item.category) ? (
            <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full", CATEGORY_COLORS[item.category])}>
              <PackingCategoryIcon category={item.category} className="size-3.5" />
            </span>
          ) : null}
          <span className={cn("min-w-0 break-words", optimistic && "text-muted-foreground line-through")}>{item.name}</span>
          {item.quantity > 1 ? <span className="shrink-0 text-sm text-muted-foreground">× {item.quantity}</span> : null}
        </label>
        {travelerCount > 1 ? (
          <span
            className={cn(
              "shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums",
              item.packedCount >= travelerCount && "bg-primary/10 text-primary",
            )}
            title={`${item.packedCount} of ${travelerCount} travelers packed`}
          >
            {item.packedCount}/{travelerCount}
          </span>
        ) : null}
        <ItemMenu label={`Actions for ${item.name}`}>
          <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
            Edit
          </Menu.Item>
          <Menu.Item className={cn(menuItemClass, "text-destructive")} onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="size-3.5" />
            Delete
          </Menu.Item>
        </ItemMenu>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <EditorDialog
        open={editing}
        onOpenChange={setEditing}
        title={`Edit ${item.name}`}
        description="This updates the reminder and any copies already in bags."
      >
        <ActionForm
          action={updateSharedPackingItem.bind(null, tripId, item.id)}
          submitLabel="Save"
          onSaved={() => setEditing(false)}
        >
          <ItemFields name={item.name} category={item.category} quantity={item.quantity} />
        </ActionForm>
      </EditorDialog>
      <DeleteDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        message={`Are you sure you want to delete "${item.name}" from the shared list? Copies already in bags stay there.`}
        onConfirm={() => {
          setConfirmingDelete(false);
          setError(null);
          void deleteSharedPackingItem(tripId, item.id).then((result) => {
            if (result && "error" in result && result.error) setError(result.error);
          });
        }}
      />
    </li>
  );
}

const SUGGEST_CLOTHES_STEP_ICONS = {
  forecast: CloudSun,
  match: Shirt,
  choose: Sparkles,
  save: Luggage,
} satisfies Record<SuggestClothesStep, typeof CloudSun>;

function SuggestClothes({ tripId, bags }: { tripId: string; bags: PackingBag[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [steps, setSteps] = useState<SuggestClothesStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const formId = useId();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setCount(null);
    setSteps(["forecast"]);
    try {
      const response = await fetch(`/api/trips/${tripId}/suggest-clothes`, { method: "POST", body: formData });
      if (!response.ok || !response.body) {
        setError("Could not suggest clothes.");
        return;
      }
      const result = await readSuggestEvents(response.body, (step) => {
        setSteps((current) => (current.includes(step) ? current : [...current, step]));
      });
      if (result.error) setError(result.error);
      else {
        setCount(result.count ?? 0);
        router.refresh();
      }
    } catch {
      setError("Could not suggest clothes.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid w-full gap-2 sm:w-auto sm:justify-items-start">
      <div className="grid gap-2 sm:flex sm:items-end">
        {bags.length > 0 ? (
          <Field label="Suggest into" className="sm:w-40">
            <Select form={formId} name="luggageId" defaultValue={bags[0].id} disabled={pending}>
              {bags.map((bag) => (
                <option key={bag.id} value={bag.id}>
                  {bag.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <form id={formId} onSubmit={onSubmit} className="flex">
            <Button type="submit" disabled={pending} className="w-full">
              <Sparkles data-icon="inline-start" />
              Suggest clothes
            </Button>
          </form>
          <AddBagButton tripId={tripId} />
        </div>
      </div>
      {pending && steps.length > 0 ? (
        <ol className="grid justify-items-start gap-1 text-left text-sm" aria-live="polite">
          {steps.map((step, index) => {
            const current = index === steps.length - 1;
            const Icon = SUGGEST_CLOTHES_STEP_ICONS[step];
            return (
              <li
                key={step}
                className={cn("flex items-center gap-2", current ? "text-foreground" : "text-muted-foreground")}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center" aria-hidden="true">
                  {current ? null : <Check className="size-3.5" />}
                </span>
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {SUGGEST_CLOTHES_STEP_LABELS[step]}
                  {current ? "…" : ""}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}
      {error ? <p className="max-w-sm text-left text-sm text-destructive">{error}</p> : null}
      {count != null && !pending ? (
        <p className="max-w-sm text-left text-sm text-muted-foreground">
          Added {count} {count === 1 ? "item" : "items"}.
        </p>
      ) : null}
    </div>
  );
}

async function readSuggestEvents(body: ReadableStream<Uint8Array>, onStep: (step: SuggestClothesStep) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: { error?: string; count?: number } = {};

  const take = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const event = JSON.parse(trimmed.slice(5).trim()) as {
      step?: unknown;
      error?: unknown;
      ok?: unknown;
      count?: unknown;
    };
    if (isSuggestClothesStep(event.step)) onStep(event.step);
    if (typeof event.error === "string") result = { error: event.error };
    if (event.ok === true) result = { count: typeof event.count === "number" ? event.count : 0 };
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) take(line);
  }
  take(buffer);
  if (!result.error && result.count == null) return { error: "Could not suggest clothes." };
  return result;
}

function AddBagButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="flex">
      <Button type="button" className="w-full" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Add a bag
      </Button>
      <EditorDialog open={open} onOpenChange={setOpen} title="Add a bag" description="A pack, bag, trolley, or piece of luggage.">
        <ActionForm action={createLuggage.bind(null, tripId)} submitLabel="Add bag" onSaved={() => setOpen(false)}>
          <BagFields />
        </ActionForm>
      </EditorDialog>
    </span>
  );
}

function BagCard({
  tripId,
  bag,
  bags,
  closet,
  dev,
  onMove,
}: {
  tripId: string;
  bag: PackingBag;
  bags: PackingBag[];
  closet: ClosetOption[];
  dev: boolean;
  onMove: (itemId: string, toBagId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [fromCloset, setFromCloset] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [over, setOver] = useState(false);
  const packed = bag.items.filter((item) => item.packed).length;

  useEffect(() => {
    function clear() {
      setOver(false);
    }
    window.addEventListener("dragend", clear);
    return () => window.removeEventListener("dragend", clear);
  }, []);

  function dragFromAnotherBag(event: React.DragEvent) {
    if (!activeDrag || activeDrag.fromBagId === bag.id) return false;
    const types = Array.from(event.dataTransfer.types);
    return types.includes(PACKING_DRAG) || types.includes("text/plain");
  }

  return (
    <Card
      className={cn(over && "ring-2 ring-primary")}
      onDragEnter={(event) => {
        if (!dragFromAnotherBag(event)) return;
        setOver(true);
      }}
      onDragOver={(event) => {
        if (!dragFromAnotherBag(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setOver(false);
      }}
      onDrop={(event) => {
        const types = Array.from(event.dataTransfer.types);
        if (!types.includes(PACKING_DRAG) && !types.includes("text/plain")) return;
        event.preventDefault();
        setOver(false);
        const itemId =
          event.dataTransfer.getData(PACKING_DRAG) || event.dataTransfer.getData("text/plain") || activeDrag?.itemId;
        const fromBagId = activeDrag?.fromBagId;
        activeDrag = null;
        if (!itemId || fromBagId === bag.id) return;
        onMove(itemId, bag.id);
      }}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LuggageKindIcon kind={bag.kind} className="size-5 shrink-0" />
          <span>{bag.name}</span>
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", kindColor(bag.kind))}>
            {luggageLabel(bag.kind)}
          </span>
          <span>
            {packed} of {bag.items.length} packed
          </span>
        </CardDescription>
        <CardAction>
          <ItemMenu label={`Actions for ${bag.name}`}>
            <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
              Edit
            </Menu.Item>
            {dev ? (
              <Menu.Item className={menuItemClass} onClick={() => setConfirmingClear(true)}>
                Clear items
              </Menu.Item>
            ) : null}
            <Menu.Item
              className={cn(menuItemClass, "text-destructive")}
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Menu.Item>
          </ItemMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        {bag.items.length === 0 ? (
          <p className={cn("text-sm text-muted-foreground", over && "text-foreground")}>
            {over ? "Drop here." : "Nothing in here yet."}
          </p>
        ) : null}
        {PACKING_CATEGORIES.map((category) => {
          const items = bag.items
            .filter((item) => item.category === category)
            .sort((a, b) => a.name.localeCompare(b.name));
          if (items.length === 0) return null;
          return (
            <section key={category} className="grid gap-1">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full",
                    CATEGORY_COLORS[category],
                  )}
                >
                  <PackingCategoryIcon category={category} className="size-3.5" />
                </span>
                {CATEGORY_LABELS[category]}
              </h3>
              <ul className="grid grid-cols-1 gap-1 [&>*]:min-w-0">
                {items.map((item) => (
                  <PackingRow key={item.id} tripId={tripId} bagId={bag.id} item={item} bags={bags} />
                ))}
              </ul>
            </section>
          );
        })}
        {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            Add item
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setFromCloset(true)}>
            Add from closet
          </Button>
        </div>
      </CardContent>
      <EditorDialog open={editing} onOpenChange={setEditing} title={`Edit ${bag.name}`} description="Rename it or change what kind of bag it is.">
        <ActionForm
          action={updateLuggage.bind(null, tripId, bag.id)}
          submitLabel="Save"
          onSaved={() => setEditing(false)}
        >
          <BagFields name={bag.name} kind={bag.kind} />
        </ActionForm>
      </EditorDialog>
      <EditorDialog open={adding} onOpenChange={setAdding} title={`Add to ${bag.name}`} description="A closet piece, or anything else you want to bring.">
        <AddItemForm tripId={tripId} luggageId={bag.id} closet={closet} onSaved={() => setAdding(false)} />
      </EditorDialog>
      <EditorDialog
        open={fromCloset}
        onOpenChange={setFromCloset}
        title={`Closet items for ${bag.name}`}
        description="Checked pieces are added as clothes or accessories."
      >
        {closet.length === 0 ? (
          <p className="text-sm text-muted-foreground">Everything in your closet is already on this list, or the closet is empty.</p>
        ) : (
          <ActionForm
            action={addClosetItems.bind(null, tripId, bag.id)}
            submitLabel="Add selected"
            onSaved={() => setFromCloset(false)}
          >
            <CheckList
              name="closetItemId"
              defaultChecked={false}
              options={closet.map((item) => ({ id: item.id, label: item.name }))}
            />
          </ActionForm>
        )}
      </EditorDialog>
      <DeleteDialog
        open={confirmingClear}
        onOpenChange={setConfirmingClear}
        message={`Are you sure you want to clear the items in "${bag.name}"?`}
        confirmLabel="Clear items"
        onConfirm={() => {
          setConfirmingClear(false);
          setDeleteError(null);
          void clearLuggageItems(tripId, bag.id).then((result) => {
            if (result && "error" in result && result.error) setDeleteError(result.error);
          });
        }}
      />
      <DeleteDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        message={`Are you sure you want to delete "${bag.name}"?`}
        onConfirm={() => {
          setConfirmingDelete(false);
          setDeleteError(null);
          void deleteLuggage(tripId, bag.id).then((result) => {
            if (result && "error" in result && result.error) setDeleteError(result.error);
          });
        }}
      />
    </Card>
  );
}

function PackingRow({
  tripId,
  bagId,
  item,
  bags,
}: {
  tripId: string;
  bagId: string;
  item: PackingListItem;
  bags: PackingBag[];
}) {
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const rowRef = useRef<HTMLLIElement>(null);

  return (
    <li ref={rowRef} className={cn("flex items-start gap-2 rounded-lg px-1 py-1", dragging && "opacity-40")}>
      <span
        draggable
        role="button"
        aria-label={`Drag ${item.name} to another bag`}
        title="Drag to another bag"
        className="inline-flex size-6 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:cursor-grabbing"
        onDragStart={(event) => {
          activeDrag = { itemId: item.id, fromBagId: bagId };
          event.dataTransfer.setData(PACKING_DRAG, item.id);
          event.dataTransfer.setData("text/plain", item.id);
          event.dataTransfer.effectAllowed = "move";
          if (rowRef.current) event.dataTransfer.setDragImage(rowRef.current, 16, 16);
          setDragging(true);
        }}
        onDragEnd={() => {
          activeDrag = null;
          setDragging(false);
        }}
      >
        <GripVertical className="size-4" />
      </span>
      <PackedCheck tripId={tripId} item={item} />
      <ItemMenu label={`Actions for ${item.name}`}>
        <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" />
          Edit
        </Menu.Item>
        <Menu.Item
          className={cn(menuItemClass, "text-destructive")}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 className="size-3.5" />
          Delete
        </Menu.Item>
      </ItemMenu>
      {deleteError ? <span className="text-xs text-destructive">{deleteError}</span> : null}
      <EditorDialog open={editing} onOpenChange={setEditing} title={`Edit ${item.name}`} description="Change the name, category, quantity, or bag.">
        <ActionForm
          action={updatePackingItem.bind(null, tripId, item.id)}
          submitLabel="Save"
          onSaved={() => setEditing(false)}
        >
          <ItemFields
            name={item.name}
            category={item.category}
            quantity={item.quantity}
            luggageId={bagId}
            bags={bags}
          />
        </ActionForm>
      </EditorDialog>
      <DeleteDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        message={`Are you sure you want to delete "${item.name}"?`}
        onConfirm={() => {
          setConfirmingDelete(false);
          setDeleteError(null);
          void deletePackingItem(tripId, item.id).then((result) => {
            if (result && "error" in result && result.error) setDeleteError(result.error);
          });
        }}
      />
    </li>
  );
}

function PackedCheck({ tripId, item }: { tripId: string; item: PackingListItem }) {
  const [optimistic, setOptimistic] = useOptimistic(item.packed, (_current, next: boolean) => next);
  const [, startTransition] = useTransition();

  return (
    <label className="flex min-w-0 flex-1 items-start gap-2">
      <CheckBox
        checked={optimistic}
        onChange={() => {
          const next = !item.packed;
          startTransition(async () => {
            setOptimistic(next);
            await setPackingItemPacked(tripId, item.id, next);
          });
        }}
      />
      {isPackingCategory(item.category) ? (
        <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full", CATEGORY_COLORS[item.category])}>
          {item.slot ? (
            <ClothingSlotIcon slot={item.slot} className="size-3.5" />
          ) : (
            <PackingCategoryIcon category={item.category} className="size-3.5" />
          )}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className={cn("min-w-0 break-words", optimistic && "text-muted-foreground line-through")}>{item.name}</span>
          {item.quantity > 1 ? <span className="shrink-0 text-sm text-muted-foreground">× {item.quantity}</span> : null}
        </span>
        {item.note ? (
          <span className="block text-xs break-words whitespace-pre-line text-muted-foreground">
            {item.note}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function AddItemForm({
  tripId,
  luggageId,
  closet,
  onSaved,
}: {
  tripId: string;
  luggageId: string;
  closet: ClosetOption[];
  onSaved: () => void;
}) {
  const [closetId, setClosetId] = useState("");
  const selected = closet.find((item) => item.id === closetId);

  return (
    <ActionForm action={createPackingItem.bind(null, tripId, luggageId)} submitLabel="Add item" onSaved={onSaved}>
      {closet.length > 0 ? (
        <Field label="Closet item">
          <Select value={closetId} onChange={(event) => setClosetId(event.target.value)}>
            <option value="">None</option>
            {closet.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <input type="hidden" name="closetItemId" value={closetId} />
        </Field>
      ) : null}
      <ItemFields
        key={closetId}
        name={selected?.name ?? ""}
        category={selected ? categoryForSlot(selected.slot) : "OTHER"}
        quantity={1}
      />
    </ActionForm>
  );
}

function BagFields({ name = "", kind = "PACK" }: { name?: string; kind?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Name">
        <Input name="name" defaultValue={name} required />
      </Field>
      <Field label="Kind">
        <Select name="kind" defaultValue={kind}>
          {LUGGAGE_KINDS.map((option) => (
            <option key={option} value={option}>
              {LUGGAGE_LABELS[option]}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

function ItemFields({
  name = "",
  category = "OTHER",
  quantity = 1,
  luggageId,
  bags,
}: {
  name?: string;
  category?: string;
  quantity?: number;
  luggageId?: string;
  bags?: PackingBag[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Name" className="sm:col-span-2">
        <Input name="name" defaultValue={name} required />
      </Field>
      <Field label="Category">
        <Select name="category" defaultValue={category}>
          {PACKING_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {CATEGORY_LABELS[option]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Quantity">
        <Input name="quantity" type="number" min={1} max={99} step={1} defaultValue={quantity} />
      </Field>
      {bags && luggageId ? (
        <Field label="Bag" className="sm:col-span-2">
          <Select name="luggageId" defaultValue={luggageId}>
            {bags.map((bag) => (
              <option key={bag.id} value={bag.id}>
                {bag.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
    </div>
  );
}

function ItemMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Menu.Root>
      <Menu.Trigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={label}>
        <EllipsisVertical />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
          <Menu.Popup className="min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-lg font-medium">{title}</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>
              </div>
              <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                <X />
              </Dialog.Close>
            </div>
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function kindColor(kind: string) {
  return kind in KIND_COLORS ? KIND_COLORS[kind as keyof typeof KIND_COLORS] : "bg-muted text-foreground";
}
