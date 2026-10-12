"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Check, Copy, Download, EllipsisVertical, Link2, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { Field, Select } from "@/components/fields";
import { MemberTag } from "@/components/member-tag";
import { StoredImage } from "@/components/stored-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  attachPersonalDocument,
  deletePersonalDocument,
  detachPersonalDocument,
  updatePersonalDocument,
  createPersonalDocument,
} from "@/lib/actions/personal-documents";
import { PERSONAL_DOCUMENT_KINDS, personalDocumentLabel } from "@/lib/constants";
import { formatDateLong, parseDate } from "@/lib/dates";

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-accent";

export type PersonalDocumentItem = {
  id: string;
  title: string;
  kind: string;
  storageKey: string;
  mimeType: string;
  documentNumber: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  trips: { id: string; name: string }[];
};

type DocumentFacts = {
  documentNumber: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
};

function fileName(title: string, mimeType: string) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const base = title.trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `${base}.${extensions[mimeType] ?? "jpg"}`;
}

function printDocument(src: string, title: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc || !frame.contentWindow) {
    frame.remove();
    return;
  }
  const safeTitle = title.replace(/[&<>"]/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return "&quot;";
  });
  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><title>${safeTitle}</title><style>@page{margin:12mm}html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img alt="" src="${src}" /></body></html>`,
  );
  doc.close();
  const image = doc.querySelector("img");
  const start = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    frame.contentWindow?.addEventListener("afterprint", () => frame.remove(), { once: true });
  };
  if (image?.complete) start();
  else image?.addEventListener("load", start, { once: true });
}

async function downloadDocument(src: string, filename: string) {
  const response = await fetch(src);
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function DocumentFields({
  title = "",
  kind = "PASSPORT",
  documentNumber = "",
  issuedOn = "",
  expiresOn = "",
}: {
  title?: string;
  kind?: string;
  documentNumber?: string;
  issuedOn?: string;
  expiresOn?: string;
}) {
  return (
    <>
      <Field label="Title">
        <Input name="title" defaultValue={title} required />
      </Field>
      <Field label="Type">
        <Select name="kind" defaultValue={kind}>
          {PERSONAL_DOCUMENT_KINDS.map((item) => (
            <option key={item} value={item}>
              {personalDocumentLabel(item)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Number">
        <Input name="documentNumber" defaultValue={documentNumber} maxLength={40} autoComplete="off" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Issued">
          <Input name="issuedOn" type="date" defaultValue={issuedOn} />
        </Field>
        <Field label="Expires">
          <Input name="expiresOn" type="date" defaultValue={expiresOn} />
        </Field>
      </div>
    </>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={copied ? "Copied" : label}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function DocumentDetails({ document }: { document: DocumentFacts }) {
  const issued = document.issuedOn ? parseDate(document.issuedOn) : null;
  const expires = document.expiresOn ? parseDate(document.expiresOn) : null;
  const rows = [
    document.documentNumber
      ? { label: "Number", value: document.documentNumber, copy: document.documentNumber }
      : null,
    issued ? { label: "Issued", value: formatDateLong(issued), copy: document.issuedOn ?? "" } : null,
    expires ? { label: "Expires", value: formatDateLong(expires), copy: document.expiresOn ?? "" } : null,
  ].filter((row): row is { label: string; value: string; copy: string } => Boolean(row));
  if (rows.length === 0) return null;
  return (
    <dl className="mb-3 grid gap-1 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="flex min-w-0 items-center gap-1 font-medium">
            <span className="truncate">{row.value}</span>
            <CopyButton value={row.copy} label={`Copy ${row.label.toLowerCase()}`} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PersonalDocumentAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" className="w-fit shrink-0" onClick={() => setOpen(true)}>
        <Plus />
        Add a document
      </Button>
      {open ? (
        <Dialog.Root open onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
              <Dialog.Popup className="relative my-auto w-full max-w-lg rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <Dialog.Title className="text-lg font-medium">Add a document</Dialog.Title>
                    <Dialog.Description className="text-sm text-muted-foreground">
                      A passport, ID, license, or visa. Number and dates are optional, and stay private until you attach
                      this document to a trip.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                    <X />
                  </Dialog.Close>
                </div>
                <ActionForm action={createPersonalDocument} submitLabel="Save document" onSaved={() => setOpen(false)}>
                  <DocumentFields />
                  <Field label="Image">
                    <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
                  </Field>
                </ActionForm>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </>
  );
}

export function PersonalDocumentCard({ document }: { document: PersonalDocumentItem }) {
  const [viewing, setViewing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = `/api/files/${document.storageKey}`;
  const filename = fileName(document.title, document.mimeType);

  return (
    <Card className="pt-0">
      <button
        type="button"
        className="block w-full cursor-pointer overflow-hidden rounded-t-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`View ${document.title}`}
        onClick={() => setViewing(true)}
      >
        <StoredImage src={src} alt={document.title} className="aspect-[4/3] w-full object-cover" />
      </button>
      <CardHeader>
        <CardTitle>
          <button type="button" className="text-left hover:underline" onClick={() => setViewing(true)}>
            {document.title}
          </button>
        </CardTitle>
        <CardDescription>
          {personalDocumentLabel(document.kind)}
          {document.trips.length > 0
            ? ` · On ${document.trips.map((trip) => trip.name).join(", ")}`
            : " · Not attached to a trip"}
        </CardDescription>
        <DocumentDetails document={document} />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <CardAction>
          <Menu.Root>
            <Menu.Trigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={`Actions for ${document.title}`}>
              <EllipsisVertical />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
                <Menu.Popup className="min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
                  <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Menu.Item>
                  <Menu.Item className={menuItemClass} onClick={() => printDocument(src, document.title)}>
                    <Printer className="size-3.5" />
                    Print
                  </Menu.Item>
                  <Menu.Item className={menuItemClass} onClick={() => void downloadDocument(src, filename)}>
                    <Download className="size-3.5" />
                    Download
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
      {viewing ? (
        <Dialog.Root open onOpenChange={setViewing}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Dialog.Popup className="w-full max-w-3xl rounded-xl bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <Dialog.Title className="text-lg font-medium">{document.title}</Dialog.Title>
                  <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                    <X />
                  </Dialog.Close>
                </div>
                <DocumentDetails document={document} />
                <StoredImage src={src} alt={document.title} className="max-h-[75vh] w-full object-contain" />
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
      {editing ? (
        <Dialog.Root open onOpenChange={setEditing}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
              <Dialog.Popup className="relative my-auto w-full max-w-lg rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <Dialog.Title className="text-lg font-medium">Edit document</Dialog.Title>
                  <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                    <X />
                  </Dialog.Close>
                </div>
                <ActionForm
                  action={updatePersonalDocument.bind(null, document.id)}
                  submitLabel="Save"
                  onSaved={() => setEditing(false)}
                >
                  <DocumentFields
                    title={document.title}
                    kind={document.kind}
                    documentNumber={document.documentNumber ?? ""}
                    issuedOn={document.issuedOn ?? ""}
                    expiresOn={document.expiresOn ?? ""}
                  />
                  <Field label="Image">
                    <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
                  </Field>
                </ActionForm>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        message={`Are you sure you want to delete "${document.title}"? It will also be removed from any trip it is attached to.`}
        onConfirm={() => {
          setConfirming(false);
          setError(null);
          void deletePersonalDocument(document.id).then((result) => {
            if (result && "error" in result && result.error) setError(result.error);
          });
        }}
      />
    </Card>
  );
}

export function AttachedPersonalDocumentCard({
  tripId,
  document,
  owner,
  canDetach,
}: {
  tripId: string;
  document: {
    id: string;
    title: string;
    kind: string;
    storageKey: string;
    mimeType: string;
    documentNumber: string | null;
    issuedOn: string | null;
    expiresOn: string | null;
  };
  owner: { id: string; name: string; imageKey: string | null };
  canDetach: boolean;
}) {
  const [viewing, setViewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = `/api/files/${document.storageKey}`;
  const filename = fileName(document.title, document.mimeType);

  return (
    <Card className="pt-0">
      <button
        type="button"
        className="block w-full cursor-pointer overflow-hidden rounded-t-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`View ${document.title}`}
        onClick={() => setViewing(true)}
      >
        <StoredImage src={src} alt={document.title} className="aspect-[4/3] w-full object-cover" />
      </button>
      <CardHeader>
        <CardTitle>
          <button type="button" className="text-left hover:underline" onClick={() => setViewing(true)}>
            {document.title}
          </button>
        </CardTitle>
        <CardDescription>
          <span className="inline-flex flex-wrap items-center gap-1">
            {personalDocumentLabel(document.kind)} ·{" "}
            <MemberTag userId={owner.id} name={owner.name} imageKey={owner.imageKey} />
          </span>
        </CardDescription>
        <DocumentDetails document={document} />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <CardAction>
          <Menu.Root>
            <Menu.Trigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={`Actions for ${document.title}`}>
              <EllipsisVertical />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
                <Menu.Popup className="min-w-40 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
                  <Menu.Item className={menuItemClass} onClick={() => printDocument(src, document.title)}>
                    <Printer className="size-3.5" />
                    Print
                  </Menu.Item>
                  <Menu.Item className={menuItemClass} onClick={() => void downloadDocument(src, filename)}>
                    <Download className="size-3.5" />
                    Download
                  </Menu.Item>
                  {canDetach ? (
                    <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirming(true)}>
                      <Trash2 className="size-3.5" />
                      Remove from trip
                    </Menu.Item>
                  ) : null}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </CardAction>
      </CardHeader>
      {viewing ? (
        <Dialog.Root open onOpenChange={setViewing}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Dialog.Popup className="w-full max-w-3xl rounded-xl bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <Dialog.Title className="text-lg font-medium">{document.title}</Dialog.Title>
                  <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                    <X />
                  </Dialog.Close>
                </div>
                <DocumentDetails document={document} />
                <StoredImage src={src} alt={document.title} className="max-h-[75vh] w-full object-contain" />
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        confirmLabel="Remove"
        message={`Remove "${document.title}" from this trip? It stays in your documents.`}
        onConfirm={() => {
          setConfirming(false);
          setError(null);
          void detachPersonalDocument(tripId, document.id).then((result) => {
            if (result && "error" in result && result.error) setError(result.error);
          });
        }}
      />
    </Card>
  );
}

function AttachButton({ tripId, documentId }: { tripId: string; documentId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => {
          setPending(true);
          setError(null);
          void attachPersonalDocument(tripId, documentId).then((result) => {
            if (result && "error" in result && result.error) {
              setError(result.error);
              setPending(false);
            }
          });
        }}
      >
        <Link2 />
        {pending ? "Attaching..." : "Attach"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function BringDocuments({
  tripId,
  copy,
  documents,
}: {
  tripId: string;
  copy: string;
  documents: { id: string; title: string; kind: string; suggested: boolean }[];
}) {
  const suggested = documents.filter((document) => document.suggested);
  const optional = documents.filter((document) => !document.suggested);

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bring your documents</CardTitle>
          <CardDescription>{copy}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Add a passport, ID, or license once, then attach it to the trips that need it.
          </p>
          <Button nativeButton={false} render={<Link href="/documents" />}>
            <Plus />
            Go to Documents
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bring your documents</CardTitle>
        <CardDescription>{copy} Attaching shares the file with everyone on this trip.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {suggested.length > 0 ? <DocumentRows tripId={tripId} documents={suggested} /> : null}
        {optional.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium">Not suggested for this trip</p>
            <DocumentRows tripId={tripId} documents={optional} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DocumentRows({
  tripId,
  documents,
}: {
  tripId: string;
  documents: { id: string; title: string; kind: string }[];
}) {
  return (
    <ul className="grid gap-2">
      {documents.map((document) => (
        <li key={document.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{document.title}</span>
            <span className="text-xs text-muted-foreground">{personalDocumentLabel(document.kind)}</span>
          </span>
          <AttachButton tripId={tripId} documentId={document.id} />
        </li>
      ))}
    </ul>
  );
}
