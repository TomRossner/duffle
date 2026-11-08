"use client";

import { FileText, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { scanPersonalDocument } from "@/lib/actions/personal-documents";
import { useLocale, useT } from "@/i18n/client";
import { INTL_LOCALES, type Locale } from "@/i18n/config";
import type { Translator } from "@/i18n/translate";
import { compressImage, formatFileSize, setInputFile } from "@/lib/image-compress";
import { cn } from "@/lib/utils";

const accept = "application/pdf,image/jpeg,image/png,image/webp,image/gif";
const acceptedTypes = new Set(accept.split(","));
const serverLimit = 5 * 1024 * 1024;

export type ScanResult =
  | { status: "read"; facts: Record<string, string | null> }
  | { status: "unavailable" }
  | { status: "error"; error: string };

/** What the reader reads the file with, and which form inputs it may fill. */
export type FileReader = {
  read: (body: FormData) => Promise<ScanResult>;
  /**
   * Form inputs the reader can fill, with how to name them in the status message. `replaceDefault` lets the
   * reader replace a value the form opened with (like a select's first option), not only an empty one.
   */
  fields: readonly { name: string; label: string; replaceDefault?: boolean }[];
  /** Shown under the upload prompt. */
  hint: string;
  /** Shown when the reader found none of the fields. */
  nothingFound: string;
  /** Also fill inputs that still hold the value the form opened with, not only empty ones. */
  replaceDefaults?: boolean;
};

export function personalDocumentReader(t: Translator<"documents">): FileReader {
  return {
    read: scanPersonalDocument,
    fields: [
      // The type always has a value (it opens on Passport), so the reading replaces it unless the traveler changed it.
      { name: "kind", label: t("file.fields.type"), replaceDefault: true },
      { name: "fullName", label: t("file.fields.name") },
      { name: "documentNumber", label: t("file.fields.number") },
      { name: "issuedOn", label: t("file.fields.issueDate") },
      { name: "expiresOn", label: t("file.fields.expiryDate") },
    ],
    hint: t("file.personalHint"),
    nothingFound: t("file.personalNothing"),
  };
}

type FillTarget = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function isFillTarget(element: unknown): element is FillTarget {
  return (
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
  );
}

function initialValue(target: FillTarget) {
  if (!(target instanceof HTMLSelectElement)) return target.defaultValue;
  const options = Array.from(target.options);
  return (options.find((option) => option.defaultSelected) ?? options[0])?.value ?? "";
}

type Status =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "filled"; text: string }
  | { kind: "note"; text: string }
  | { kind: "error"; text: string };

function joinLabels(labels: string[], locale: Locale) {
  return new Intl.ListFormat(INTL_LOCALES[locale], { style: "long", type: "conjunction" }).format(labels);
}

/**
 * Upload or drop a PDF or image. Large photos are resized in the browser, and when a reader is given the file is read
 * and fills the form inputs the traveler hasn't filled in yet.
 */
export function DocumentFileField({
  required = false,
  label,
  reader: readerProp,
}: {
  required?: boolean;
  label?: string;
  /** Defaults to reading identity documents; null turns reading off. */
  reader?: FileReader | null;
}) {
  const t = useT("documents");
  const locale = useLocale();
  const reader = readerProp === undefined ? personalDocumentReader(t) : readerProp;
  const inputRef = useRef<HTMLInputElement>(null);
  const scanId = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number; isPdf: boolean; preview: string | null } | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => () => {
    if (file?.preview) URL.revokeObjectURL(file.preview);
  }, [file]);

  async function handleFile(picked: File) {
    const input = inputRef.current;
    if (!input) return;
    const id = ++scanId.current;

    if (!acceptedTypes.has(picked.type)) {
      input.value = "";
      setFile(null);
      setStatus({ kind: "error", text: t("file.invalidType") });
      return;
    }

    let upload = picked;
    try {
      // Keep documents sharp enough to read, but well under the 5MB upload limit.
      upload = await compressImage(picked, { maxDimension: 2400, lightBytes: 1.5 * 1024 * 1024, quality: 0.9 });
    } catch {
      // Not decodable in this browser; send the original and let the server validate it.
    }
    if (id !== scanId.current) return;
    setInputFile(input, upload);

    const isPdf = upload.type === "application/pdf";
    setFile({
      name: picked.name,
      size: upload.size,
      isPdf,
      preview: isPdf ? null : URL.createObjectURL(upload),
    });

    if (upload.size > serverLimit) {
      setStatus({ kind: "error", text: isPdf ? t("file.pdfTooLarge") : t("file.imageTooLarge") });
      return;
    }
    if (!reader) {
      setStatus({ kind: "idle" });
      return;
    }

    setStatus({ kind: "reading" });
    const body = new FormData();
    body.set("file", upload);
    let result: ScanResult;
    try {
      result = await reader.read(body);
    } catch {
      result = { status: "error", error: t("file.readFailed") };
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
    const filled: string[] = [];
    const kept: string[] = [];
    for (const field of reader.fields) {
      const value = result.facts[field.name];
      const target = form?.elements.namedItem(field.name);
      if (!value || !isFillTarget(target)) continue;
      if (target instanceof HTMLSelectElement && !Array.from(target.options).some((option) => option.value === value)) {
        continue;
      }
      const current = target.value.trim();
      const untouched =
        !current ||
        current === value ||
        ((reader.replaceDefaults || field.replaceDefault) && target.value === initialValue(target));
      if (!untouched) {
        kept.push(field.label);
        continue;
      }
      target.value = value;
      filled.push(field.label);
    }

    if (filled.length > 0) {
      const note = kept.length > 0 ? ` ${t("file.kept", { fields: joinLabels(kept, locale) })}` : "";
      setStatus({ kind: "filled", text: `${t("file.filled", { fields: joinLabels(filled, locale) })}${note}` });
    } else if (kept.length > 0) {
      setStatus({ kind: "note", text: t("file.kept", { fields: joinLabels(kept, locale) }) });
    } else {
      setStatus({ kind: "note", text: reader.nothingFound });
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm leading-none font-medium">{label ?? t("file.label")}</span>
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
          required={required}
          className="sr-only"
          onChange={(event) => {
            const picked = event.currentTarget.files?.[0];
            if (picked) void handleFile(picked);
          }}
        />
        {file ? (
          <>
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
              {file.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.preview} alt="" className="size-full object-cover" />
              ) : (
                <FileText className="size-6 text-muted-foreground" />
              )}
            </span>
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {file.isPdf ? t("file.pdf") : t("file.image")} · {formatFileSize(file.size)} · {t("file.replace")}
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
                {t.rich("file.prompt", { em: (chunks) => <span className="text-primary">{chunks}</span> })}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("file.limit")}{reader ? ` ${reader.hint}` : ""}
              </span>
            </span>
          </>
        )}
      </label>
      {status.kind === "reading" ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          <LoaderCircle className="size-3.5 animate-spin" />
          {t("file.reading")}
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
  );
}
