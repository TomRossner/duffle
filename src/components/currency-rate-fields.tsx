"use client";

import { useState } from "react";
import { CurrencyPicker } from "@/components/currency-picker";
import { Field, Select } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { CURRENCIES } from "@/lib/constants";

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
  const [currency, setCurrency] = useState(defaultValue);
  const same = currency === baseCurrency;

  return (
    <>
      <Field label="Currency">
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
      <Field label="Exchange rate (optional)">
        <Input
          name="manualRate"
          type="number"
          min="0"
          step="0.0001"
          inputMode="decimal"
          defaultValue={defaultRate}
          disabled={same}
          placeholder={same ? "Not needed" : `1 ${currency} = ? ${baseCurrency}`}
          title={
            same
              ? `Amounts in ${baseCurrency} need no conversion.`
              : `How many ${baseCurrency} one ${currency} is worth. Leave empty to use that day's rate.`
          }
        />
      </Field>
    </>
  );
}
