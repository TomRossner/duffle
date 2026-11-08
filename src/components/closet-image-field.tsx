"use client";

import { LoaderCircle, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Field } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { scanClosetItem } from "@/lib/actions/closet";
import type { ClosetFacts } from "@/lib/closet-reader";
import { compressImage, formatFileSize, setInputFile } from "@/lib/image-compress";
import { cn } from "@/lib/utils";

const accept = "image/jpeg,image/png,image/webp,image/gif";
const acceptedTypes = new Set(accept.split(","));
const serverLimit = 5 * 1024 * 1024;

type Status =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "filled"; text: string }
  | { kind: "note"; text: string }
  | { kind: "error"; text: string };

function untouched(element: Element | RadioNodeList | null) {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value === element.defaultValue;
  }
  if (element instanceof HTMLSelectElement) {
    return Array.from(element.options).every((option) => option.selected === option.defaultSelected);
  }
  return false;
}

function checkboxes(form: HTMLFormElement, name: string) {
  return Array.from(form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${name}"]`));
}

/** Fill the closet form from the reader's facts, leaving anything the traveler already changed. Returns whether anything was filled. */
function fillForm(form: HTMLFormElement, facts: ClosetFacts) {
  let filled = false;
  const setText = (name: string, value: string | number | null) => {
    const target = form.elements.namedItem(name);
    if (value == null || !untouched(target)) return;
    (target as HTMLInputElement).value = String(value);
    filled = true;
  };
  setText("name", facts.name);
  setText("description", facts.description);
  setText("slot", facts.slot);
  setText("tempMin", facts.tempMin);
  setText("tempMax", facts.tempMax);

  const setChecks = (name: string, values: string[]) => {
    const boxes = checkboxes(form, name);
    if (values.length === 0 || boxes.some((box) => box.checked !== box.defaultChecked)) return;
    for (const box of boxes) box.checked = values.includes(box.value);
    filled = true;
  };
  setChecks("conditions", facts.conditions);
  setChecks("activities", facts.activities);
  if (facts.goreTex) setChecks("goreTex", ["yes"]);
  if (facts.driFit) setChecks("driFit", ["yes"]);
  return filled;
}

/**
 * Upload or drop a photo of the item, or paste an image URL. Large photos are resized in the browser, and when
 * `scan` is on the photo is read by the closet reader, which fills the fields the traveler hasn't changed yet.
 */
export function ClosetImageField({
  imageUrl = "",
  keepImage = false,
  scan = true,
}: {
  imageUrl?: string;
  keepImage?: boolean;
  scan?: boolean;
}) {
  const t = useT("closet");
  const inputRef = useRef<HTMLInputElement>(null);
  const scanId = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number; preview: string } | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => () => {
    if (file) URL.revokeObjectURL(file.preview);
  }, [file]);

  async function handleFile(picked: File) {
    const input = inputRef.current;
    if (!input) return;
    const id = ++scanId.current;

    if (!acceptedTypes.has(picked.type)) {
      input.value = "";
      setFile(null);
      setStatus({ kind: "error", text: t("image.badType") });
      return;
    }

    let upload = picked;
    try {
      upload = await compressImage(picked, { maxDimension: 1600, lightBytes: 1024 * 1024, keepGifsUnder: serverLimit });
    } catch {
      // Not decodable in this browser; send the original and let the server validate it.
    }
    if (id !== scanId.current) return;
    setInputFile(input, upload);
    setFile({ name: picked.name, size: upload.size, preview: URL.createObjectURL(upload) });

    if (upload.size > serverLimit) {
      setStatus({ kind: "error", text: t("image.tooBig") });
      return;
    }
    if (!scan) {
      setStatus({ kind: "idle" });
      return;
    }

    setStatus({ kind: "reading" });
    const body = new FormData();
    body.set("file", upload);
    let result: Awaited<ReturnType<typeof scanClosetItem>>;
    try {
      result = await scanClosetItem(body);
    } catch {
      result = { status: "error", error: t("errors.readFailed") };
    }
    if (id !== scanId.current) return;

    if (result.status === "unavailable") {
      setStatus({ kind: "idle" });
      return;
    }
    if (result.status === "error") {
      setStatus({ kind: "error", text: result.error });
      return;
    }

    const form = input.form;
    if (form && fillForm(form, result.facts)) {
      setStatus({ kind: "filled", text: t("image.filled") });
    } else {
      setStatus({ kind: "note", text: t("image.kept") });
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <span className="text-sm leading-none font-medium">{t("image.photo")}</span>
        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input p-3 transition-colors hover:bg-muted/50",
            "has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            dragging && "border-primary bg-primary/5",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) void handleFile(dropped);
          }}
        >
          <input
            ref={inputRef}
            name="file"
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(event) => {
              const picked = event.currentTarget.files?.[0];
              if (picked) void handleFile(picked);
            }}
          />
          {file ? (
            <>
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.preview} alt="" className="size-full object-cover" />
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="truncate text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t("image.fileMeta", { size: formatFileSize(file.size) })}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="grid size-14 shrink-0 place-items-center rounded-md bg-muted">
                <Upload className="size-6 text-muted-foreground" />
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="text-sm font-medium">
                  {t.rich("image.prompt", { em: (chunks) => <span className="text-primary">{chunks}</span> })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("image.formats")}
                  {scan ? ` ${t("image.autoFill")}` : ""}
                </span>
              </span>
            </>
          )}
        </label>
        {status.kind === "reading" ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
            <LoaderCircle className="size-3.5 animate-spin" />
            {t("image.reading")}
          </p>
        ) : status.kind === "filled" ? (
          <p className="flex items-start gap-1.5 text-xs text-primary" aria-live="polite">
            <Sparkles className="mt-px size-3.5 shrink-0" />
            {status.text}
          </p>
        ) : status.kind === "note" ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {status.text}
          </p>
        ) : status.kind === "error" ? (
          <p className="text-xs text-destructive" aria-live="polite">
            {status.text}
          </p>
        ) : null}
      </div>
      <Field label={t("image.pasteUrl")}>
        <Input name="imageUrl" type="url" placeholder="https://" defaultValue={imageUrl} />
      </Field>
      {keepImage ? <p className="text-sm text-muted-foreground">{t("image.keepCurrent")}</p> : null}
    </div>
  );
}
