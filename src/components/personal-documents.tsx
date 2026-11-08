"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Check, Copy, Download, EllipsisVertical, FileText, Link2, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { DocumentFileField } from "@/components/document-file-field";
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
import { useLocale, useT } from "@/i18n/client";
import { PERSONAL_DOCUMENT_KINDS, documentKindLabel } from "@/lib/constants";
import { formatDateShort, parseDate } from "@/lib/dates";

function useKindLabel() {
  const tLabels = useT("labels");
  return (kind: string) => documentKindLabel(tLabels, kind);
}

const menuItemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5 outline-none data-highlighted:bg-accent";

export type PersonalDocumentItem = {
  id: string;
  title: string;
  kind: string;
  storageKey: string;
  mimeType: string;
  fullName: string | null;
  documentNumber: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  trips: { id: string; name: string }[];
};

type DocumentFacts = {
  fullName: string | null;
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
    "application/pdf": "pdf",
  };
  const base = title.trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
  return `${base}.${extensions[mimeType] ?? "jpg"}`;
}

function isPdf(mimeType: string) {
  return mimeType === "application/pdf";
}

// PDFs open in the browser's own viewer: the app sends X-Frame-Options: DENY, so they can't be framed in-page.
function openInNewTab(src: string) {
  window.open(src, "_blank", "noopener,noreferrer");
}

function DocumentThumb({ src, mimeType, title }: { src: string; mimeType: string; title: string }) {
  const t = useT("documents");
  if (isPdf(mimeType)) {
    return (
      <span className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
        <FileText className="size-10" />
        <span className="text-xs font-medium tracking-wide">{t("card.pdfOpen")}</span>
      </span>
    );
  }
  return <StoredImage src={src} alt={title} className="aspect-[4/3] w-full object-cover" />;
}

function printDocument(src: string, title: string, mimeType: string) {
  if (isPdf(mimeType)) {
    // The browser's PDF viewer has its own print button.
    openInNewTab(src);
    return;
  }
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
  fullName = "",
  documentNumber = "",
  issuedOn = "",
  expiresOn = "",
}: {
  title?: string;
  kind?: string;
  fullName?: string;
  documentNumber?: string;
  issuedOn?: string;
  expiresOn?: string;
}) {
  const t = useT("documents");
  const kindLabel = useKindLabel();
  return (
    <>
      <Field label={t("form.title")}>
        <Input name="title" defaultValue={title} required />
      </Field>
      <Field label={t("form.type")}>
        <Select name="kind" defaultValue={kind}>
          {PERSONAL_DOCUMENT_KINDS.map((item) => (
            <option key={item} value={item}>
              {kindLabel(item)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("personal.fullName")}>
        <Input
          name="fullName"
          defaultValue={fullName}
          maxLength={120}
          autoComplete="off"
          dir="auto"
          placeholder={t("personal.fullNamePlaceholder")}
        />
      </Field>
      <Field label={t("personal.number")}>
        <Input name="documentNumber" defaultValue={documentNumber} maxLength={40} autoComplete="off" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("personal.issued")}>
          <Input name="issuedOn" type="date" defaultValue={issuedOn} />
        </Field>
        <Field label={t("personal.expires")}>
          <Input name="expiresOn" type="date" defaultValue={expiresOn} />
        </Field>
      </div>
    </>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const tCommon = useT("common");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex size-9 shrink-0 items-center sm:size-6 justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={copied ? tCommon("copied") : label}
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
  const t = useT("documents");
  const locale = useLocale();
  const issued = document.issuedOn ? parseDate(document.issuedOn) : null;
  const expires = document.expiresOn ? parseDate(document.expiresOn) : null;
  type Row = { label: string; copyLabel: string; value: string; copy: string };
  const rows = [
    document.fullName
      ? { label: t("personal.name"), copyLabel: t("personal.copyName"), value: document.fullName, copy: document.fullName }
      : null,
    document.documentNumber
      ? {
          label: t("personal.number"),
          copyLabel: t("personal.copyNumber"),
          value: document.documentNumber,
          copy: document.documentNumber,
        }
      : null,
    issued
      ? {
          label: t("personal.issued"),
          copyLabel: t("personal.copyIssued"),
          value: formatDateShort(issued, locale),
          copy: document.issuedOn ?? "",
        }
      : null,
    expires
      ? {
          label: t("personal.expires"),
          copyLabel: t("personal.copyExpires"),
          value: formatDateShort(expires, locale),
          copy: document.expiresOn ?? "",
        }
      : null,
  ].filter((row): row is Row => Boolean(row));
  if (rows.length === 0) return null;
  return (
    <dl className="mb-3 grid gap-1 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="flex min-w-0 items-center gap-1 font-medium">
            <span className="truncate" dir="auto">{row.value}</span>
            <CopyButton value={row.copy} label={row.copyLabel} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PersonalDocumentAddButton() {
  const t = useT("documents");
  const tCommon = useT("common");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" className="w-full shrink-0 sm:w-fit" onClick={() => setOpen(true)}>
        <Plus />
        {t("personal.addTitle")}
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto w-full max-w-lg rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">{t("personal.addTitle")}</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {t("personal.addDescription")}
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                  <X />
                </Dialog.Close>
              </div>
              <ActionForm action={createPersonalDocument} submitLabel={t("personal.saveDocument")} onSaved={() => setOpen(false)}>
                <DocumentFileField required />
                <DocumentFields />
              </ActionForm>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

export function PersonalDocumentCard({ document }: { document: PersonalDocumentItem }) {
  const t = useT("documents");
  const tCommon = useT("common");
  const kindLabel = useKindLabel();
  const [viewing, setViewing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = `/api/files/${document.storageKey}`;
  const filename = fileName(document.title, document.mimeType);
  const view = () => (isPdf(document.mimeType) ? openInNewTab(src) : setViewing(true));

  return (
    <Card className="pt-0">
      <button
        type="button"
        className="block w-full cursor-pointer overflow-hidden rounded-t-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={t("card.view", { title: document.title })}
        onClick={view}
      >
        <DocumentThumb src={src} mimeType={document.mimeType} title={document.title} />
      </button>
      <CardHeader>
        <CardTitle>
          <button type="button" className="text-start hover:underline" onClick={view}>
            {document.title}
          </button>
        </CardTitle>
        <CardDescription>
          {kindLabel(document.kind)}
          {" · "}
          {document.trips.length > 0
            ? t("personal.onTrips", { trips: document.trips.map((trip) => trip.name).join(", ") })
            : t("personal.notAttached")}
        </CardDescription>
        <DocumentDetails document={document} />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <CardAction>
          <Menu.Root>
            <Menu.Trigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("actionsFor", { name: document.title })}>
              <EllipsisVertical />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
                <Menu.Popup className="min-w-48 sm:min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
                  <Menu.Item className={menuItemClass} onClick={() => setEditing(true)}>
                    <Pencil className="size-3.5" />
                    {tCommon("edit")}
                  </Menu.Item>
                  <Menu.Item className={menuItemClass} onClick={() => printDocument(src, document.title, document.mimeType)}>
                    <Printer className="size-3.5" />
                    {t("card.print")}
                  </Menu.Item>
                  <Menu.Item className={menuItemClass} onClick={() => void downloadDocument(src, filename)}>
                    <Download className="size-3.5" />
                    {t("card.download")}
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
      <Dialog.Root open={viewing} onOpenChange={setViewing}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="dialog-popup w-full max-w-3xl rounded-xl bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-3 flex items-start justify-between gap-3">
                <Dialog.Title className="text-lg font-medium">{document.title}</Dialog.Title>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                  <X />
                </Dialog.Close>
              </div>
              <DocumentDetails document={document} />
              <StoredImage src={src} alt={document.title} className="max-h-[75vh] w-full object-contain" />
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={editing} onOpenChange={setEditing}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto w-full max-w-lg rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <Dialog.Title className="text-lg font-medium">{t("card.editTitle")}</Dialog.Title>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                  <X />
                </Dialog.Close>
              </div>
              <ActionForm
                action={updatePersonalDocument.bind(null, document.id)}
                submitLabel={tCommon("save")}
                onSaved={() => setEditing(false)}
              >
                <DocumentFileField />
                <DocumentFields
                  title={document.title}
                  kind={document.kind}
                  fullName={document.fullName ?? ""}
                  documentNumber={document.documentNumber ?? ""}
                  issuedOn={document.issuedOn ?? ""}
                  expiresOn={document.expiresOn ?? ""}
                />
              </ActionForm>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        message={t("personal.confirmDelete", { title: document.title })}
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
    fullName: string | null;
    documentNumber: string | null;
    issuedOn: string | null;
    expiresOn: string | null;
  };
  owner: { id: string; name: string; imageKey: string | null };
  canDetach: boolean;
}) {
  const t = useT("documents");
  const tCommon = useT("common");
  const kindLabel = useKindLabel();
  const [viewing, setViewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = `/api/files/${document.storageKey}`;
  const filename = fileName(document.title, document.mimeType);
  const view = () => (isPdf(document.mimeType) ? openInNewTab(src) : setViewing(true));

  return (
    <Card className="pt-0">
      <button
        type="button"
        className="block w-full cursor-pointer overflow-hidden rounded-t-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={t("card.view", { title: document.title })}
        onClick={view}
      >
        <DocumentThumb src={src} mimeType={document.mimeType} title={document.title} />
      </button>
      <CardHeader>
        <CardTitle>
          <button type="button" className="text-start hover:underline" onClick={view}>
            {document.title}
          </button>
        </CardTitle>
        <CardDescription>
          <span className="inline-flex flex-wrap items-center gap-1">
            {kindLabel(document.kind)} ·{" "}
            <MemberTag userId={owner.id} name={owner.name} imageKey={owner.imageKey} />
          </span>
        </CardDescription>
        <DocumentDetails document={document} />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <CardAction>
          <Menu.Root>
            <Menu.Trigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("actionsFor", { name: document.title })}>
              <EllipsisVertical />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
                <Menu.Popup className="min-w-52 sm:min-w-40 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
                  <Menu.Item className={menuItemClass} onClick={() => printDocument(src, document.title, document.mimeType)}>
                    <Printer className="size-3.5" />
                    {t("card.print")}
                  </Menu.Item>
                  <Menu.Item className={menuItemClass} onClick={() => void downloadDocument(src, filename)}>
                    <Download className="size-3.5" />
                    {t("card.download")}
                  </Menu.Item>
                  {canDetach ? (
                    <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirming(true)}>
                      <Trash2 className="size-3.5" />
                      {t("personal.removeFromTrip")}
                    </Menu.Item>
                  ) : null}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </CardAction>
      </CardHeader>
      <Dialog.Root open={viewing} onOpenChange={setViewing}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Popup className="dialog-popup w-full max-w-3xl rounded-xl bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-3 flex items-start justify-between gap-3">
                <Dialog.Title className="text-lg font-medium">{document.title}</Dialog.Title>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tCommon("close")}>
                  <X />
                </Dialog.Close>
              </div>
              <DocumentDetails document={document} />
              <StoredImage src={src} alt={document.title} className="max-h-[75vh] w-full object-contain" />
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      <DeleteDialog
        open={confirming}
        onOpenChange={setConfirming}
        confirmLabel={tCommon("remove")}
        message={t("personal.confirmDetach", { title: document.title })}
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
  const t = useT("documents");
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
        {pending ? t("personal.attaching") : t("personal.attach")}
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
  const t = useT("documents");
  const suggested = documents.filter((document) => document.suggested);
  const optional = documents.filter((document) => !document.suggested);

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("bring.title")}</CardTitle>
          <CardDescription>{copy}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">{t("bring.addOnce")}</p>
          <Button nativeButton={false} render={<Link href="/documents" />}>
            <Plus />
            {t("bring.goTo")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("bring.title")}</CardTitle>
        <CardDescription>
          {copy} {t("bring.sharing")}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {suggested.length > 0 ? <DocumentRows tripId={tripId} documents={suggested} /> : null}
        {optional.length > 0 ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium">{t("bring.notSuggested")}</p>
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
  const kindLabel = useKindLabel();
  return (
    <ul className="grid gap-2">
      {documents.map((document) => (
        <li key={document.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{document.title}</span>
            <span className="text-xs text-muted-foreground">{kindLabel(document.kind)}</span>
          </span>
          <AttachButton tripId={tripId} documentId={document.id} />
        </li>
      ))}
    </ul>
  );
}
