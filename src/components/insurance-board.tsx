"use client";

import { useState, type ComponentProps } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { CostFields, Field, Select } from "@/components/fields";
import { MemberTag } from "@/components/member-tag";
import { StoredImage } from "@/components/stored-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPolicy, deletePolicy, updatePolicy } from "@/lib/actions/insurance";
import { INSURANCE_TYPES } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-accent";

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
  amount: string | null;
  currency: string | null;
};

function typeLabel(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function PolicyImageField({ imageKey, provider }: { imageKey?: string | null; provider?: string }) {
  const [removed, setRemoved] = useState(false);
  const showing = Boolean(imageKey) && !removed;

  return (
    <div className="grid gap-3">
      {showing ? (
        <div className="grid gap-2">
          <StoredImage
            src={`/api/files/${imageKey}`}
            alt={provider ? `${provider} policy` : "Policy image"}
            className="max-h-48 rounded-lg bg-muted/40 object-contain"
          />
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRemoved(true)}>
            <Trash2 />
            Remove image
          </Button>
        </div>
      ) : null}
      {removed ? (
        <div className="grid gap-2">
          <input type="hidden" name="removeImage" value="1" />
          <p className="text-sm text-muted-foreground">The current image will be removed when you save.</p>
          <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setRemoved(false)}>
            Keep current image
          </Button>
        </div>
      ) : null}
      <Field label={showing ? "Replace image" : "Policy image"}>
        <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
      </Field>
    </div>
  );
}

function PolicyFields({
  members,
  currency,
  defaults,
}: {
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
  };
}) {
  return (
    <>
      <Field label="Insurer">
        <Input name="provider" defaultValue={defaults?.provider} required />
      </Field>
      <Field label="Type">
        <Select name="type" defaultValue={defaults?.type ?? "TRAVEL"}>
          {INSURANCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Policy number">
        <Input name="policyNumber" defaultValue={defaults?.policyNumber} />
      </Field>
      <Field label="Traveler">
        <Select name="userId" defaultValue={defaults?.userId}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Starts">
          <Input name="startDate" type="date" defaultValue={defaults?.startDate} required />
        </Field>
        <Field label="Ends">
          <Input name="endDate" type="date" defaultValue={defaults?.endDate} required />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea name="notes" rows={2} defaultValue={defaults?.notes} />
      </Field>
      <PolicyImageField imageKey={defaults?.imageKey} provider={defaults?.provider} />
      <CostFields currency={defaults?.currency || currency} amount={defaults?.amount} />
    </>
  );
}

function PolicyDialog({
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
  if (!open) return null;

  return (
    <Dialog.Root open onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <Dialog.Popup className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-lg font-medium">{title}</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>
              </div>
              <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                <X />
              </Dialog.Close>
            </div>
            <ActionForm action={action} submitLabel={submitLabel} onSaved={() => onOpenChange(false)}>
              <PolicyFields members={members} currency={currency} defaults={defaults} />
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
  const [adding, setAdding] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setAdding(true)}>
          <Plus />
          Add a policy
        </Button>
      </div>
      <PolicyDialog
        open={adding}
        onOpenChange={setAdding}
        title="Add a policy"
        description="A cost becomes a planned expense for the insured traveler. An image is stored with the trip documents."
        action={createPolicy.bind(null, tripId)}
        submitLabel="Save policy"
        members={members}
        currency={currency}
        defaults={{ userId: defaultTravelerId, startDate: defaultStart, endDate: defaultEnd }}
      />
      {policies.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="size-4" />
          No policies yet.
        </p>
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
              aria-label={`Actions for ${policy.provider}`}
            >
              <EllipsisVertical />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
                <Menu.Popup className="min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
                  <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Menu.Item>
                  <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirming(true)}>
                    <Trash2 className="size-3.5" />
                    Delete
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
            <p className="text-sm">Planned cost {formatMoney(Number(policy.amount), policy.currency)}</p>
          ) : null}
          {policy.imageKey ? (
            <StoredImage
              src={`/api/files/${policy.imageKey}`}
              alt={`${policy.provider} policy`}
              className="max-h-64 rounded-lg object-contain"
            />
          ) : null}
        </CardContent>
      ) : null}
      <PolicyDialog
        open={editing}
        onOpenChange={setEditing}
        title="Edit policy"
        description="Update the coverage, the traveler, or the planned cost."
        action={updatePolicy.bind(null, tripId, policy.id)}
        submitLabel="Save policy"
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
        }}
      />
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        message={`Are you sure you want to delete the ${policy.provider} policy?`}
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
