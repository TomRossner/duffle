"use client";

import { useState } from "react";
import { CountryPicker } from "@/components/country-picker";
import { Field, Select } from "@/components/fields";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { callingCode, composePhone, GENDERS, nationalNumber } from "@/lib/account-details";

export function AccountDetailsFields({
  defaults,
}: {
  defaults?: {
    gender?: string | null;
    birthDate?: string | null;
    phone?: string | null;
    country?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
  };
}) {
  const t = useT("profile");
  const today = new Date().toISOString().slice(0, 10);
  const [country, setCountry] = useState(defaults?.country ?? "");
  const [national, setNational] = useState(nationalNumber(defaults?.phone, defaults?.country));
  const prefix = callingCode(country);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("gender")}>
          <Select name="gender" defaultValue={defaults?.gender ?? ""} required>
            <option value="">{t("choose")}</option>
            {GENDERS.map((gender) => (
              <option key={gender.value} value={gender.value}>
                {t(`genders.${gender.value}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("birthDate")}>
          <Input
            name="birthDate"
            type="date"
            autoComplete="bday"
            required
            max={today}
            min="1900-01-01"
            defaultValue={defaults?.birthDate ?? ""}
          />
        </Field>
        <Field label={t("country")}>
          <CountryPicker value={country} onValueChange={setCountry} />
        </Field>
        <Field label={t("phone")}>
          <div dir="ltr" className="flex h-8 items-center overflow-hidden rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="flex h-full shrink-0 items-center border-r border-input bg-muted px-2 text-sm text-muted-foreground">
              {prefix ? `+${prefix}` : "—"}
            </span>
            <input
              value={national}
              onChange={(event) => setNational(event.target.value)}
              inputMode="tel"
              autoComplete="tel-national"
              required
              placeholder={prefix ? t("localNumber") : t("chooseCountryFirst")}
              aria-label={t("phoneNumber")}
              className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <input type="hidden" name="phone" value={composePhone(national, country)} />
        </Field>
      </div>
      <Field label={t("address")}>
        <Input name="address" autoComplete="street-address" required defaultValue={defaults?.address ?? ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("city")}>
          <Input name="city" autoComplete="address-level2" required defaultValue={defaults?.city ?? ""} />
        </Field>
        <Field label={t("postalCode")}>
          <Input name="postalCode" autoComplete="postal-code" required defaultValue={defaults?.postalCode ?? ""} />
        </Field>
      </div>
    </>
  );
}
