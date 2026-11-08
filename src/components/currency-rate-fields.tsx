"use client";

import { useState } from "react";
import { CurrencyPicker } from "@/components/currency-picker";
import { Field, Select } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { CURRENCIES } from "@/lib/constants";

/** The optional amount of a cost. */
export function CostAmountField({ amount }: { amount?: string }) {
  const t = useT("ui");
  return (
    <Field label={t("costOptional")}>
      <Input name="amount" type="number" min="0" step="0.01" placeholder="0.00" defaultValue={amount || undefined} />
    </Field>
  );
}

/**
 * The currency of an amount and an optional exchange rate into the trip's currency. The rate's placeholder spells
 * the conversion out for the chosen currency ("1 EUR = ? USD"); left empty, the day's rate is used.
 */
export function CurrencyRateFields({
  name = "currency",
  defaultValue,
  baseCurrency,
  defaultRate,
  withSymbols = false,
}: {
  name?: string;
  defaultValue: string;
  /** The trip's currency, which amounts are converted into. */
  baseCurrency: string;
  defaultRate?: string;
  withSymbols?: boolean;
}) {
  const t = useT("ui");
  const [currency, setCurrency] = useState(defaultValue);
  const same = currency === baseCurrency;

  return (
    <>
      <Field label={t("currency")}>
        {withSymbols ? (
          <CurrencyPicker name={name} defaultValue={defaultValue} onValueChange={setCurrency} />
        ) : (
          <Select name={name} defaultValue={defaultValue} onChange={(event) => setCurrency(event.target.value)}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={t("rateOptional")}>
        <Input
          name="manualRate"
          type="number"
          min="0"
          step="0.0001"
          inputMode="decimal"
          defaultValue={defaultRate}
          disabled={same}
          placeholder={same ? t("rateNotNeeded") : t("ratePlaceholder", { currency, base: baseCurrency })}
          title={
            same
              ? t("rateSame", { base: baseCurrency })
              : t("rateHint", { base: baseCurrency, currency })
          }
        />
      </Field>
    </>
  );
}
