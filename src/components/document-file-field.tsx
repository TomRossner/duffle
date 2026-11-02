"use client";

import { FileText, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { scanPersonalDocument } from "@/lib/actions/personal-documents";
import { compressImage, formatFileSize, setInputFile } from "@/lib/image-compress";
import { cn } from "@/lib/utils";

const accept = "application/pdf,image/jpeg,image/png,image/webp,image/gif";
const acceptedTypes = new Set(accept.split(","));
const serverLimit = 5 * 1024 * 1024;

// Form inputs the reader can fill, with how to name them in the status message.
const fillable = [
  { name: "documentNumber", label: "number" },
  { name: "issuedOn", label: "issue date" },
  { name: "expiresOn", label: "expiry date" },
] as const;

type Status =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "filled"; text: string }
  | { kind: "note"; text: string }
  | { kind: "error"; text: string };

function joinLabels(labels: string[]) {
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * Upload or drop a PDF or image. Large photos are resized in the browser, and when `scan` is on the file is read
 * by the document reader, which fills the number and dates the traveler hasn't typed yet.
 */
export function DocumentFileField({ required = false, scan = true }: { required?: boolean; scan?: boolean }) {
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
      setStatus({ kind: "error", text: "Use a PDF, JPEG, PNG, WebP, or GIF." });
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
      setStatus({ kind: "error", text: `${isPdf ? "This PDF" : "This image"} is over 5MB. Choose a smaller file.` });
      return;
    }
    if (!scan) {
      setStatus({ kind: "idle" });
      return;
    }

    setStatus({ kind: "reading" });
    const body = new FormData();
    body.set("file", upload);
    let result: Awaited<ReturnType<typeof scanPersonalDocument>>;
    try {
      result = await scanPersonalDocument(body);
    } catch {
      result = { status: "error", error: "Couldn't read the document. Fill in the details yourself." };
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
    for (const field of fillable) {
      const value = result.facts[field.name];
      const target = form?.elements.namedItem(field.name);
      if (!value || !(target instanceof HTMLInputElement)) continue;
      if (target.value.trim() && target.value.trim() !== value) {
        kept.push(field.label);
        continue;
      }
      target.value = value;
      filled.push(field.label);
    }

    if (filled.length > 0) {
      const note = kept.length > 0 ? ` Kept the ${joinLabels(kept)} you entered.` : "";
      setStatus({ kind: "filled", text: `Filled the ${joinLabels(filled)} from the document. Check them before saving.${note}` });
    } else if (kept.length > 0) {
      setStatus({ kind: "note", text: `Kept the ${joinLabels(kept)} you entered.` });
    } else {
      setStatus({ kind: "note", text: "Couldn't find a number or dates on this document. Fill them in yourself." });
    }
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm leading-none font-medium">File</span>
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
                {file.isPdf ? "PDF" : "Image"} · {formatFileSize(file.size)} · Click or drop to replace
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
                <span className="text-primary">Upload a file</span> or drop it here
              </span>
              <span className="text-xs text-muted-foreground">
                PDF or image, up to 5MB.{scan ? " The number and dates are filled in for you." : ""}
              </span>
            </span>
          </>
        )}
      </label>
      {status.kind === "reading" ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          <LoaderCircle className="size-3.5 animate-spin" />
          Reading the document…
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
