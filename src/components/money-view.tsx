"use client";

import { Menu } from "@base-ui/react/menu";
import { ArrowLeftRight, Check, ChevronDown, LoaderCircle, Undo2 } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getExchangeRate } from "@/lib/actions/fx";
import { useLocale, useT } from "@/i18n/client";
import { INTL_LOCALES } from "@/i18n/config";
import { currencyName } from "@/lib/account-details";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/constants";
import { cn, formatMoney } from "@/lib/utils";

type DisplayState = {
  base: string;
  target: string;
  rate: number;
  rateDate: string | null;
  pending: boolean;
  error: string | null;
  choose: (code: string) => void;
};

const DisplayCurrency = createContext<DisplayState | null>(null);

function useDisplayCurrency() {
  const value = useContext(DisplayCurrency);
  if (!value) throw new Error("This must be inside DisplayCurrencyProvider.");
  return value;
}

const storageKey = (tripId: string) => `money-display-currency:${tripId}`;

/** Lets everything inside show trip-currency amounts in a currency the viewer picks. */
export function DisplayCurrencyProvider({
  tripId,
  base,
  children,
}: {
  tripId: string;
  base: string;
  children: React.ReactNode;
}) {
  const t = useT("money");
  const [target, setTarget] = useState(base);
  const [rate, setRate] = useState(1);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(code: string) {
    setError(null);
    try {
      if (code === base) localStorage.removeItem(storageKey(tripId));
      else localStorage.setItem(storageKey(tripId), code);
    } catch {}
    if (code === base) {
      setTarget(base);
      setRate(1);
      setRateDate(null);
      return;
    }
    setPending(true);
    load(code, true).finally(() => setPending(false));
  }

  function load(code: string, showErrors: boolean) {
    return getExchangeRate(base, code)
      .then((result) => {
        if ("error" in result) {
          if (showErrors) setError(result.error ?? t("view.rateError"));
          return;
        }
        setTarget(code);
        setRate(result.rate);
        setRateDate(result.date);
      })
      .catch(() => {
        if (showErrors) setError(t("view.rateError"));
      });
  }

  // Bring back the currency this viewer last picked for this trip.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey(tripId));
    } catch {}
    if (saved && saved !== base && (CURRENCIES as readonly string[]).includes(saved)) load(saved, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DisplayCurrency.Provider value={{ base, target, rate, rateDate, pending, error, choose }}>
      {children}
    </DisplayCurrency.Provider>
  );
}

/**
 * An amount in the trip currency, shown in the currency the viewer picked.
 * Outside a DisplayCurrencyProvider it shows the amount in `currency` as-is.
 */
export function Money({ amount, currency, className }: { amount: number; currency?: string; className?: string }) {
  const t = useT("money");
  const locale = useLocale();
  const display = useContext(DisplayCurrency);
  const base = display?.base ?? currency ?? "USD";
  const target = display?.target ?? base;
  const rate = display?.rate ?? 1;
  const converted = target !== base;
  return (
    <span
      className={cn("tabular-nums", className)}
      title={converted ? t("view.inBase", { amount: formatMoney(amount, base, locale), currency: base }) : undefined}
    >
      {formatMoney(amount * rate, target, locale)}
    </span>
  );
}

/** The amount as entered, when it was in a currency other than the one on screen. */
export function OriginalAmount({ amount, currency }: { amount: number; currency: string }) {
  const { target } = useDisplayCurrency();
  const locale = useLocale();
  if (currency === target) return null;
  return <span className="text-xs text-muted-foreground tabular-nums">{formatMoney(amount, currency, locale)}</span>;
}

export function DisplayCurrencyCode() {
  return <>{useDisplayCurrency().target}</>;
}

export function ConvertCurrencyButton() {
  const { base, target, rate, rateDate, pending, error, choose } = useDisplayCurrency();
  const t = useT("money");
  const locale = useLocale();
  const converted = target !== base;

  return (
    <div className="grid w-full gap-2 sm:w-auto sm:justify-items-end">
      <Menu.Root>
        <Menu.Trigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full justify-between sm:w-auto",
            converted && "border-primary/40 bg-primary/5 hover:bg-primary/10",
          )}
          disabled={pending}
        >
          <span className="flex items-center gap-2">
            {pending ? <LoaderCircle className="animate-spin" /> : <ArrowLeftRight />}
            {converted ? t("view.showingIn") : t("view.convert")}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold",
                converted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <span className="[font-family:system-ui,sans-serif]">{CURRENCY_SYMBOLS[target as keyof typeof CURRENCY_SYMBOLS] ?? ""}</span>
              {target}
            </span>
          </span>
          <ChevronDown className="text-muted-foreground" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
            <Menu.Popup className="max-h-80 w-64 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
              <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("view.showIn")}</p>
              {CURRENCIES.map((code) => (
                <Menu.Item
                  key={code}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:px-2 sm:py-1.5 sm:text-sm text-start outline-none data-highlighted:bg-accent"
                  onClick={() => choose(code)}
                >
                  <span className="w-6 shrink-0 text-center font-medium [font-family:system-ui,sans-serif]">
                    {CURRENCY_SYMBOLS[code]}
                  </span>
                  <span className="w-8 shrink-0 font-medium">{code}</span>
                  <span className="truncate text-muted-foreground">
                    {code === base ? t("view.tripCurrency") : currencyName(code, locale)}
                  </span>
                  {code === target ? <Check className="ms-auto size-4 shrink-0" /> : null}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {converted ? (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 py-1 pe-1 ps-3 text-xs text-muted-foreground sm:justify-end">
          <span>
            1 {base} = {rate.toLocaleString(INTL_LOCALES[locale], { maximumFractionDigits: 4 })} {target}
            {rateDate ? ` · ${rateDate}` : ""}
          </span>
          <Button type="button" variant="ghost" size="xs" onClick={() => choose(base)}>
            <Undo2 />
            {t("view.backTo", { currency: base })}
          </Button>
        </div>
      ) : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
