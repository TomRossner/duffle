"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Droplets, EllipsisVertical, Pencil, Plus, Shirt, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { ClosetImageField } from "@/components/closet-image-field";
import { CheckList, Field, FieldGroup, Select } from "@/components/fields";
import { StoredImage } from "@/components/stored-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeleteDialog } from "@/components/delete-dialog";
import { createClosetItem, deleteClosetItem, updateClosetItem } from "@/lib/actions/closet";
import { CLOSET_ACTIVITY_TAGS, CLOTHING_SLOT_GROUPS, CLOTHING_SLOT_LABELS, CONDITION_TAGS, slotLabel } from "@/lib/constants";
import {
  ACTIVITY_COLORS,
  ActivityTagLabel,
  WEATHER_COLORS,
  WeatherTagLabel,
  isActivityTag,
  isConditionTag,
  slotColor,
} from "@/lib/tag-meta";
import { cn } from "@/lib/utils";

export type ClosetDraft = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  src: string | null;
  slot: string;
  quantity: number;
  tempMin: string;
  tempMax: string;
  conditions: string[];
  activities: string[];
  goreTex: boolean;
  driFit: boolean;
  hasImage: boolean;
};

export function ClosetFields({
  name = "",
  description = "",
  imageUrl = "",
  slot = "TOP",
  quantity = 1,
  tempMin = "",
  tempMax = "",
  conditions,
  activities,
  goreTex = false,
  driFit = false,
  keepImage = false,
  scan = true,
}: {
  name?: string;
  description?: string;
  imageUrl?: string;
  slot?: string;
  quantity?: number;
  tempMin?: string;
  tempMax?: string;
  conditions?: string[];
  activities?: string[];
  goreTex?: boolean;
  driFit?: boolean;
  keepImage?: boolean;
  scan?: boolean;
}) {
  return (
    <>
      <ClosetImageField imageUrl={imageUrl} keepImage={keepImage} scan={scan} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2">
          <Input name="name" defaultValue={name} required />
        </Field>
        <Field label="Type">
          <Select name="slot" defaultValue={slot}>
            {CLOTHING_SLOT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.slots.map((option) => (
                  <option key={option} value={option}>
                    {CLOTHING_SLOT_LABELS[option]}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Quantity">
          <Input name="quantity" type="number" min={1} max={99} step={1} defaultValue={quantity} required />
        </Field>
        <Field label="Coolest °C">
          <Input name="tempMin" type="number" step="1" defaultValue={tempMin} />
        </Field>
        <Field label="Warmest °C">
          <Input name="tempMax" type="number" step="1" defaultValue={tempMax} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={description} />
      </Field>
      <FieldGroup label="Weather">
        <CheckList
          name="conditions"
          defaultChecked={false}
          checkedIds={conditions}
          options={CONDITION_TAGS.map((tag) => ({
            id: tag,
            color: WEATHER_COLORS[tag],
            label: <WeatherTagLabel tag={tag} />,
          }))}
        />
      </FieldGroup>
      <FieldGroup label="Activities">
        <CheckList
          name="activities"
          defaultChecked={false}
          checkedIds={activities}
          options={CLOSET_ACTIVITY_TAGS.map((tag) => ({
            id: tag,
            color: ACTIVITY_COLORS[tag],
            label: <ActivityTagLabel tag={tag} />,
          }))}
        />
      </FieldGroup>
      <FieldGroup label="Features">
        <div className="flex flex-wrap gap-2">
          <CheckList
            name="goreTex"
            defaultChecked={false}
            checkedIds={goreTex ? ["yes"] : []}
            options={[
              {
                id: "yes",
                color: "bg-cyan-100 text-cyan-950 [&_svg]:text-cyan-600",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Droplets className="size-4 text-cyan-600" aria-hidden />
                    Gore-Tex
                  </span>
                ),
              },
            ]}
          />
          <CheckList
            name="driFit"
            defaultChecked={false}
            checkedIds={driFit ? ["yes"] : []}
            options={[
              {
                id: "yes",
                color: "bg-sky-100 text-sky-950 [&_svg]:text-sky-600",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Shirt className="size-4 text-sky-600" aria-hidden />
                    Dri-Fit
                  </span>
                ),
              },
            ]}
          />
        </div>
      </FieldGroup>
    </>
  );
}

export function ClosetCard({ item }: { item: ClosetDraft }) {
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  return (
    <Card className="pt-0">
      {item.src ? (
        <StoredImage src={item.src} alt={item.name} className="aspect-square w-full object-cover" />
      ) : (
        <div className="aspect-square w-full" aria-hidden />
      )}
      <CardHeader>
        <CardTitle>
          <span>{item.name}</span>
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium",
              slotColor(item.slot),
            )}
          >
            {slotLabel(item.slot)}
          </span>
          {item.quantity > 1 ? <span>× {item.quantity}</span> : null}
          {item.tempMin && item.tempMax ? (
            <span>
              {item.tempMin}–{item.tempMax}°C
            </span>
          ) : null}
        </CardDescription>
        <CardAction>
          <Menu.Root>
            <Menu.Trigger
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={`Actions for ${item.name}`}
            >
              <EllipsisVertical />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
                <Menu.Popup className="min-w-48 sm:min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
                  <Menu.Item
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base outline-none data-highlighted:bg-accent sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Menu.Item>
                  <Menu.Item
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base text-destructive outline-none data-highlighted:bg-accent sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5"
                    disabled={deleting}
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 className="size-3.5" />
                    {deleting ? "Deleting..." : "Delete"}
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2">
        {item.description ? <p className="text-sm">{item.description}</p> : null}
        {item.conditions.length + item.activities.length === 0 && !item.goreTex && !item.driFit ? (
          <p className="text-sm text-muted-foreground">No tags</p>
        ) : (
          <div className="grid gap-1.5">
            {item.conditions.some(isConditionTag) ? (
              <div className="flex flex-wrap gap-1.5">
                {item.conditions.filter(isConditionTag).map((tag) => (
                  <span
                    key={tag}
                    className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-sm", WEATHER_COLORS[tag])}
                  >
                    <WeatherTagLabel tag={tag} iconClassName="size-4" />
                  </span>
                ))}
              </div>
            ) : null}
            {item.goreTex || item.driFit ? (
              <div className="flex flex-wrap gap-1.5">
                {item.goreTex ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-2.5 py-1 text-sm text-cyan-950">
                    <Droplets className="size-4 text-cyan-600" aria-hidden />
                    Gore-Tex
                  </span>
                ) : null}
                {item.driFit ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-sm text-sky-950">
                    <Shirt className="size-4 text-sky-600" aria-hidden />
                    Dri-Fit
                  </span>
                ) : null}
              </div>
            ) : null}
            {item.activities.some(isActivityTag) ? (
              <div className="flex flex-wrap gap-1.5">
                {item.activities.filter(isActivityTag).map((tag) => (
                  <span
                    key={tag}
                    className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-sm", ACTIVITY_COLORS[tag])}
                  >
                    <ActivityTagLabel tag={tag} iconClassName="size-4" />
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}
        {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
      </CardContent>
      <Dialog.Root open={editing} onOpenChange={setEditing}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">Edit {item.name}</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Change the type, weather, or activities.
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                  <X />
                </Dialog.Close>
              </div>
              <ActionForm
                action={updateClosetItem.bind(null, item.id)}
                submitLabel="Save"
                onSaved={() => setEditing(false)}
              >
                <ClosetFields
                  name={item.name}
                  description={item.description}
                  imageUrl={item.imageUrl}
                  slot={item.slot}
                  quantity={item.quantity}
                  tempMin={item.tempMin}
                  tempMax={item.tempMax}
                  conditions={item.conditions}
                  activities={item.activities}
                  goreTex={item.goreTex}
                  driFit={item.driFit}
                  keepImage={item.hasImage}
                  scan={false}
                />
              </ActionForm>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      <DeleteDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        message={`Are you sure you want to delete "${item.name}"?`}
        pending={deleting}
        onConfirm={() => {
          setConfirmingDelete(false);
          setDeleting(true);
          setDeleteError(null);
          void deleteClosetItem(item.id).then((result) => {
            if (result && "error" in result && result.error) {
              setDeleteError(result.error);
              setDeleting(false);
            }
          });
        }}
      />
    </Card>
  );
}

export function ClosetAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" className="w-full shrink-0 sm:w-fit" onClick={() => setOpen(true)}>
        <Plus />
        Add an item
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">Add an item</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Drop in a photo and the details are filled in for you. Check them, then save.
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                  <X />
                </Dialog.Close>
              </div>
              <ActionForm action={createClosetItem} submitLabel="Add to closet" onSaved={() => setOpen(false)}>
                <ClosetFields />
              </ActionForm>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
