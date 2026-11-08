import { CheckBox } from "@/components/checkbox";
import { CurrencyPicker } from "@/components/currency-picker";
import { CostAmountField, CurrencyRateFields } from "@/components/currency-rate-fields";
import { CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      <span className="text-sm leading-none font-medium">{label}</span>
      {children}
    </label>
  );
}

export function FieldGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <span className="text-sm leading-none font-medium">{label}</span>
      {children}
    </div>
  );
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none sm:h-8 sm:px-2.5 sm:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function CurrencySelect({
  name = "currency",
  defaultValue = "USD",
  withSymbols = false,
}: {
  name?: string;
  defaultValue?: string;
  withSymbols?: boolean;
}) {
  if (withSymbols) {
    return <CurrencyPicker name={name} defaultValue={defaultValue} />;
  }

  return (
    <Select name={name} defaultValue={defaultValue}>
      {CURRENCIES.map((currency) => (
        <option key={currency} value={currency}>
          {currency}
        </option>
      ))}
    </Select>
  );
}

export function CostFields({
  currency,
  baseCurrency,
  amount,
  withSymbols = false,
}: {
  /** The cost's currency when the form opens. */
  currency: string;
  /** The trip's currency. Defaults to `currency`. */
  baseCurrency?: string;
  amount?: string;
  withSymbols?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <CostAmountField amount={amount} />
      <CurrencyRateFields defaultValue={currency} baseCurrency={baseCurrency ?? currency} withSymbols={withSymbols} />
    </div>
  );
}

export function CheckList({
  name,
  options,
  defaultChecked = true,
  checkedIds,
}: {
  name: string;
  options: { id: string; label: React.ReactNode; color?: string }[];
  defaultChecked?: boolean;
  checkedIds?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option.id}
          className={cn(
            "flex items-center gap-2 rounded-full px-2.5 py-1 text-sm",
            option.color ?? "bg-muted",
          )}
        >
          <CheckBox
            name={name}
            value={option.id}
            defaultChecked={checkedIds ? checkedIds.includes(option.id) : defaultChecked}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
