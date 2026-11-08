"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_ENGLISH_NAMES, LOCALE_NAMES, LOCALES, dirOf, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";
import { setLocale } from "@/lib/actions/locale";
import { cn } from "@/lib/utils";

/**
 * Picks the app's language. Each option shows its name in its own language, with the English name under
 * it, so someone who switched by mistake can still find their way back.
 */
export function LanguagePicker({ className, compact = false }: { className?: string; compact?: boolean }) {
  const locale = useLocale();
  const t = useT("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Select.Root
      value={locale}
      onValueChange={(next: Locale | null) => {
        if (!next || next === locale) return;
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
    >
      <Select.Trigger
        aria-label={t("language")}
        disabled={pending}
        className={cn(
          "flex h-11 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 text-base outline-none sm:h-8 sm:px-2 sm:text-sm",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60",
          "data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/50",
          compact ? "w-auto" : "w-full",
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Languages className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Select.Value>{(value: Locale | null) => (value ? LOCALE_NAMES[value] : t("language"))}</Select.Value>
        </span>
        <Select.Icon className="text-muted-foreground">
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="z-50 outline-none" sideOffset={6} alignItemWithTrigger={false}>
          <Select.Popup className="max-h-80 min-w-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
            <Select.List>
              {LOCALES.map((code) => (
                <Select.Item
                  key={code}
                  value={code}
                  label={LOCALE_NAMES[code]}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-base outline-none data-highlighted:bg-accent data-selected:bg-muted sm:px-2 sm:py-1.5 sm:text-sm"
                >
                  <span className="grid min-w-0 flex-1">
                    <span lang={code} dir={dirOf(code)} className="text-start font-medium">
                      {LOCALE_NAMES[code]}
                    </span>
                    {code !== "en" ? (
                      <span lang="en" className="text-xs text-muted-foreground">
                        {LOCALE_ENGLISH_NAMES[code]}
                      </span>
                    ) : null}
                  </span>
                  <Select.ItemIndicator className="text-foreground">
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
