"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

/** A small button that copies `value` and briefly confirms it. */
export function CopyButton({ value, label }: { value: string; label?: string }) {
  const t = useT("common");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? t("copied") : (label ?? t("copy"))}
      title={copied ? t("copied") : (label ?? t("copy"))}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => setCopied(true));
      }}
    >
      {copied ? <Check className="text-primary" /> : <Copy />}
    </Button>
  );
}
