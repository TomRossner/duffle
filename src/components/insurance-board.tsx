"use client";

import { EmptyState } from "@/components/empty-state";
import { useState, type ComponentProps } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical, FileText, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { DocumentFileField, type FileReader } from "@/components/document-file-field";
import { CostFields, Field, Select } from "@/components/fields";
import { MemberTag } from "@/components/member-tag";
import { StoredImage } from "@/components/stored-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPolicy, deletePolicy, scanPolicy, updatePolicy } from "@/lib/actions/insurance";
import { INSURANCE_TYPES } from "@/lib/constants";
import { useLocale, useT } from "@/i18n/client";
import type { Translator } from "@/i18n/translate";
import { formatMoney } from "@/lib/utils";

const menuItemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5 outline-none data-highlighted:bg-accent";

type Member = { id: string; name: string };

export type InsurancePolicyItem = {
  id: string;
  provider: string;
  type: string;
  policyNumber: string | null;
  startDate: string;
  endDate: string;
  startLabel: string;
  endLabel: string;
  notes: string | null;
  userId: string;
  userName: string;
  userImageKey: string | null;
  imageKey: string | null;
  imageMimeType: string | null;
  amount: string | null;
  currency: string | null;
};

function useTypeLabel() {
  const tLabels = useT("labels");
  return (type: string) =>
    tLabels.dynamic(`insuranceTypes.${type}`, undefined, type.charAt(0) + type.slice(1).toLowerCase());
}

function isPdf(mimeType?: string | null) {
  return mimeType === "application/pdf";
}

function policyReader(tripId: string, t: Translator<"insurance">): FileReader {
  return {
    read: scanPolicy.bind(null, tripId),
    fields: [
      { name: "provider", label: t("reader.insurer") },
      { name: "type", label: t("reader.type") },
      { name: "policyNumber", label: t("reader.policyNumber") },
      { name: "userId", label: t("reader.traveler") },
      { name: "startDate", label: t("reader.startDate") },
      { name: "endDate", label: t("reader.endDate") },
      { name: "amount", label: t("reader.cost") },
      { name: "currency", label: t("reader.currency") },
    ],
    hint: t("reader.hint"),
    nothingFound: t("reader.nothing"),
    // The dates and traveler start out filled with the trip's, so let the policy replace them.
    replaceDefaults: true,
  };
}

/** A PDF opens in the browser's own viewer; the app can't frame it in-page. */
function PolicyPdfLink({ imageKey }: { imageKey: string }) {
  const t = useT("insurance");
  return (
    <a
      href={`/api/files/${imageKey}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-fit items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/70"
    >
      <FileText className="size-5 text-muted-foreground" />
      {t("openPdf")}
    </a>
  );
}

function PolicyImageField({
  tripId,
  imageKey,
  imageMimeType,
  provider,
}: {
  tripId: string;
  imageKey?: string | null;
  imageMimeType?: string | null;
  provider?: string;
}) {
  const t = useT("insurance");
  const [removed, setRemoved] = useState(false);
  const showing = Boolean(imageKey) && !removed;

  return (
    <div className="grid gap-3">
      {showing && imageKey ? (
        <div className="grid gap-2">
          {isPdf(imageMimeType) ? (
            <PolicyPdfLink imageKey={imageKey} />
          ) : (
            <StoredImage
              src={`/api/files/${imageKey}`}
              alt={provider ? t("imageAlt", { provider }) : t("imageAltGeneric")}
              className="max-h-48 rounded-lg bg-muted/40 object-contain"
            />
          )}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRemoved(true)}>
            <Trash2 />
            {t("removeFile")}
          </Button>
        </div>
      ) : null}
      {removed ? (
        <div className="grid gap-2">
          <input type="hidden" name="removeImage" value="1" />
          <p className="text-sm text-muted-foreground">{t("removeOnSave")}</p>
          <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setRemoved(false)}>
            {t("keepFile")}
          </Button>
        </div>
      ) : null}
      <DocumentFileField label={showing ? t("replacePolicy") : t("policyFile")} reader={policyReader(tripId, t)} />
    </div>
  );
}

function PolicyFields({
  tripId,
  members,
  currency,
  defaults,
}: {
  tripId: string;
  members: Member[];
  currency: string;
  defaults?: {
    provider?: string;
    type?: string;
    policyNumber?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
    amount?: string;
    currency?: string;
    imageKey?: string | null;
    imageMimeType?: string | null;
  };
}) {
  const t = useT("insurance");
  const typeLabel = useTypeLabel();
  return (
    <>
      <PolicyImageField
        tripId={tripId}
        imageKey={defaults?.imageKey}
        imageMimeType={defaults?.imageMimeType}
        provider={defaults?.provider}
      />
      <Field label={t("insurer")}>
        <Input name="provider" defaultValue={defaults?.provider} required />
      </Field>
      <Field label={t("type")}>
        <Select name="type" defaultValue={defaults?.type ?? "TRAVEL"}>
          {INSURANCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("policyNumber")}>
        <Input name="policyNumber" defaultValue={defaults?.policyNumber} />
      </Field>
      <Field label={t("traveler")}>
        <Select name="userId" defaultValue={defaults?.userId}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("starts")}>
          <Input name="startDate" type="date" defaultValue={defaults?.startDate} required />
        </Field>
        <Field label={t("ends")}>
          <Input name="endDate" type="date" defaultValue={defaults?.endDate} required />
        </Field>
      </div>
      <Field label={t("notes")}>
        <Textarea name="notes" rows={2} defaultValue={defaults?.notes} />
      </Field>
      <CostFields currency={defaults?.currency || currency} baseCurrency={currency} amount={defaults?.amount} />
    </>
  );
}

function PolicyDialog({
  tripId,
  open,
  onOpenChange,
  title,
  description,
  action,
  submitLabel,
  members,
  currency,
  defaults,
}: {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  action: (state: { error?: string; ok?: boolean } | null, formData: FormData) => Promise<{ error?: string; ok?: boolean } | null | undefined>;
  submitLabel: string;
  members: Member[];
  currency: string;
  defaults?: ComponentProps<typeof PolicyFields>["defaults"];
}) {
  const tCommon = useT("common");
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
              <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                <X />
              </Dialog.Close>
            </div>
            <ActionForm action={action} submitLabel={submitLabel} onSaved={() => onOpenChange(false)}>
              <PolicyFields tripId={tripId} members={members} currency={currency} defaults={defaults} />
            </ActionForm>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function InsuranceBoard({
  tripId,
  currency,
  defaultTravelerId,
  defaultStart,
  defaultEnd,
  members,
  policies,
}: {
  tripId: string;
  currency: string;
  defaultTravelerId: string;
  defaultStart: string;
  defaultEnd: string;
  members: Member[];
  policies: InsurancePolicyItem[];
}) {
  const t = useT("insurance");
  const [adding, setAdding] = useState(false);

  return (
    <div className="grid gap-4">
      <Button type="button" className="w-full sm:w-fit" onClick={() => setAdding(true)}>
        <Plus />
        {t("addPolicy")}
      </Button>
      <PolicyDialog
        tripId={tripId}
        open={adding}
        onOpenChange={setAdding}
        title={t("addPolicy")}
        description={t("addDescription")}
        action={createPolicy.bind(null, tripId)}
        submitLabel={t("savePolicy")}
        members={members}
        currency={currency}
        defaults={{ userId: defaultTravelerId, startDate: defaultStart, endDate: defaultEnd }}
      />
      {policies.length === 0 ? (
        <EmptyState icon={Shield} title={t("emptyTitle")}>
          {t("emptyBody")}
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {policies.map((policy) => (
            <PolicyCard key={policy.id} tripId={tripId} policy={policy} members={members} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}

function PolicyCard({
  tripId,
  policy,
  members,
  currency,
}: {
  tripId: string;
  policy: InsurancePolicyItem;
  members: Member[];
  currency: string;
}) {
  const t = useT("insurance");
  const tCommon = useT("common");
  const locale = useLocale();
  const typeLabel = useTypeLabel();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = `${policy.provider} · ${typeLabel(policy.type)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-x-1">
          <MemberTag userId={policy.userId} name={policy.userName} imageKey={policy.userImageKey} />
          <span>
            · {policy.startLabel} – {policy.endLabel}
            {policy.policyNumber ? ` · ${policy.policyNumber}` : ""}
          </span>
        </CardDescription>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <CardAction>
          <Menu.Root>
            <Menu.Trigger
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={tCommon("actionsFor", { name: policy.provider })}
            >
              <EllipsisVertical />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
                <Menu.Popup className="min-w-48 sm:min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
                  <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
                    <Pencil className="size-3.5" />
                    {tCommon("edit")}
                  </Menu.Item>
                  <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirming(true)}>
                    <Trash2 className="size-3.5" />
                    {tCommon("delete")}
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </CardAction>
      </CardHeader>
      {policy.notes || policy.amount || policy.imageKey ? (
        <CardContent className="grid gap-3">
          {policy.notes ? <p className="text-sm">{policy.notes}</p> : null}
          {policy.amount && policy.currency ? (
            <p className="text-sm">
              {t("plannedCost", { amount: formatMoney(Number(policy.amount), policy.currency, locale) })}
            </p>
          ) : null}
          {policy.imageKey && isPdf(policy.imageMimeType) ? (
            <PolicyPdfLink imageKey={policy.imageKey} />
          ) : policy.imageKey ? (
            <StoredImage
              src={`/api/files/${policy.imageKey}`}
              alt={t("imageAlt", { provider: policy.provider })}
              className="max-h-64 rounded-lg object-contain"
            />
          ) : null}
        </CardContent>
      ) : null}
      <PolicyDialog
        tripId={tripId}
        open={editing}
        onOpenChange={setEditing}
        title={t("editPolicy")}
        description={t("editDescription")}
        action={updatePolicy.bind(null, tripId, policy.id)}
        submitLabel={t("savePolicy")}
        members={members}
        currency={currency}
        defaults={{
          provider: policy.provider,
          type: policy.type,
          policyNumber: policy.policyNumber ?? "",
          userId: policy.userId,
          startDate: policy.startDate,
          endDate: policy.endDate,
          notes: policy.notes ?? "",
          amount: policy.amount ?? "",
          currency: policy.currency ?? currency,
          imageKey: policy.imageKey,
          imageMimeType: policy.imageMimeType,
        }}
      />
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        message={t("confirmDelete", { provider: policy.provider })}
        onConfirm={() => {
          setConfirming(false);
          setError(null);
          void deletePolicy(tripId, policy.id).then((result) => {
            if (result && "error" in result && result.error) setError(result.error);
          });
        }}
      />
    </Card>
  );
}
