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
import { useT } from "@/i18n/client";
import { createClosetItem, deleteClosetItem, updateClosetItem } from "@/lib/actions/closet";
import { CLOSET_ACTIVITY_TAGS, CLOTHING_SLOT_GROUPS, CONDITION_TAGS, slotLabel } from "@/lib/constants";
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

/** Clothing type and type-group names in the reader's language. */
export function useSlotLabels() {
  const tLabels = useT("labels");
  return {
    slot: (slot: string) => tLabels.dynamic(`slots.${slot}`, undefined, slotLabel(slot)),
    group: (group: string) => tLabels.dynamic(`slotGroups.${group}`, undefined, group),
  };
}

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
  const t = useT("closet");
  const labels = useSlotLabels();
  return (
    <>
      <ClosetImageField imageUrl={imageUrl} keepImage={keepImage} scan={scan} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("fields.name")} className="sm:col-span-2">
          <Input name="name" defaultValue={name} required />
        </Field>
        <Field label={t("fields.type")}>
          <Select name="slot" defaultValue={slot}>
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
        <Field label={t("fields.quantity")}>
          <Input name="quantity" type="number" min={1} max={99} step={1} defaultValue={quantity} required />
        </Field>
        <Field label={t("fields.coolest")}>
          <Input name="tempMin" type="number" step="1" defaultValue={tempMin} />
        </Field>
        <Field label={t("fields.warmest")}>
          <Input name="tempMax" type="number" step="1" defaultValue={tempMax} />
        </Field>
      </div>
      <Field label={t("fields.description")}>
        <Textarea name="description" rows={2} defaultValue={description} />
      </Field>
      <FieldGroup label={t("fields.weather")}>
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
      <FieldGroup label={t("fields.activities")}>
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
      <FieldGroup label={t("fields.features")}>
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
  const t = useT("closet");
  const tCommon = useT("common");
  const labels = useSlotLabels();
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
            {labels.slot(item.slot)}
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
              aria-label={tCommon("actionsFor", { name: item.name })}
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
                    {tCommon("edit")}
                  </Menu.Item>
                  <Menu.Item
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base text-destructive outline-none data-highlighted:bg-accent sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5"
                    disabled={deleting}
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 className="size-3.5" />
                    {deleting ? tCommon("deleting") : tCommon("delete")}
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
          <p className="text-sm text-muted-foreground">{t("card.noTags")}</p>
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
                  <Dialog.Title className="text-lg font-medium">{t("card.editTitle", { name: item.name })}</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {t("card.editDescription")}
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                  <X />
                </Dialog.Close>
              </div>
              <ActionForm
                action={updateClosetItem.bind(null, item.id)}
                submitLabel={tCommon("save")}
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
        message={t("card.confirmDelete", { name: item.name })}
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
  const t = useT("closet");
  const tCommon = useT("common");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" className="w-full shrink-0 sm:w-fit" onClick={() => setOpen(true)}>
        <Plus />
        {t("add.button")}
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">{t("add.button")}</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {t("add.description")}
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                  <X />
                </Dialog.Close>
              </div>
              <ActionForm action={createClosetItem} submitLabel={t("add.submit")} onSaved={() => setOpen(false)}>
                <ClosetFields />
              </ActionForm>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
