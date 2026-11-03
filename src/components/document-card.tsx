"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Download, EllipsisVertical, Pencil, Printer, Save, Trash2, X } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { Field, Select } from "@/components/fields";
import { MemberTag } from "@/components/member-tag";
import { StoredImage } from "@/components/stored-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteDocument, updateDocument } from "@/lib/actions/documents";
import { DOCUMENT_KINDS } from "@/lib/constants";

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-highlighted:bg-accent";

type Member = { id: string; name: string };

export type TripDocument = {
  id: string;
  title: string;
  kind: string;
  storageKey: string;
  mimeType: string;
  userId: string;
  userName: string;
  userImageKey: string | null;
};

function kindLabel(kind: string) {
  return kind.charAt(0) + kind.slice(1).toLowerCase();
}

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

export function DocumentCard({
  tripId,
  document,
  members,
}: {
  tripId: string;
  document: TripDocument;
  members: Member[];
}) {
  const [viewing, setViewing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
            {kindLabel(document.kind)} ·{" "}
            <MemberTag userId={document.userId} name={document.userName} imageKey={document.userImageKey} />
          </span>
        </CardDescription>
        {deleteError ? <p className="text-xs text-destructive">{deleteError}</p> : null}
        <CardAction>
          <Menu.Root>
            <Menu.Trigger
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={`Actions for ${document.title}`}
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
                  <Menu.Item className={menuItemClass} onClick={() => printDocument(src, document.title)}>
                    <Printer className="size-3.5" />
                    Print
                  </Menu.Item>
                  <Menu.Item className={menuItemClass} onClick={() => void downloadDocument(src, filename)}>
                    <Download className="size-3.5" />
                    Download
                  </Menu.Item>
                  <Menu.Item className={`${menuItemClass} text-destructive`} onClick={() => setConfirmingDelete(true)}>
                    <Trash2 className="size-3.5" />
                    Delete
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </CardAction>
      </CardHeader>
      <DeleteDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        message={`Are you sure you want to delete "${document.title}"?`}
        onConfirm={() => {
          setConfirmingDelete(false);
          setDeleteError(null);
          void deleteDocument(tripId, document.id).then((result) => {
            if (result && "error" in result && result.error) setDeleteError(result.error);
          });
        }}
      />
      <Dialog.Root open={viewing} onOpenChange={setViewing}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-y-auto rounded-xl bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">{document.title}</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {kindLabel(document.kind)} · {document.userName}
                  </Dialog.Description>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => printDocument(src, document.title)}>
                    <Printer />
                    Print
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void downloadDocument(src, filename)}
                  >
                    <Download />
                    Download
                  </Button>
                  <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                    <X />
                  </Dialog.Close>
                </div>
              </div>
              <StoredImage src={src} alt={document.title} className="max-h-[75vh] w-full object-contain" />
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={editing} onOpenChange={setEditing}>
        <Dialog.Portal>
          <Dialog.Backdrop className="dialog-backdrop fixed inset-0 z-50 bg-black/40" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <Dialog.Popup className="dialog-popup relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-6 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium">Edit document</Dialog.Title>
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Change the title, type, or traveler. Leave the image empty to keep the current one.
                  </Dialog.Description>
                </div>
                <Dialog.Close className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Close">
                  <X />
                </Dialog.Close>
              </div>
              <ActionForm
                action={updateDocument.bind(null, tripId, document.id)}
                submitLabel="Save"
                submitIcon={<Save />}
                onSaved={() => setEditing(false)}
              >
                <Field label="Title">
                  <Input name="title" defaultValue={document.title} required />
                </Field>
                <Field label="Type">
                  <Select name="kind" defaultValue={document.kind}>
                    {DOCUMENT_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kindLabel(kind)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Traveler">
                  <Select name="userId" defaultValue={document.userId}>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Image">
                  <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
                </Field>
              </ActionForm>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </Card>
  );
}
