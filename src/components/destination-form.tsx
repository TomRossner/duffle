"use client";

import { useActionState, useEffect, useState } from "react";
import { PlaceSearch } from "@/components/place-search";
import { Field } from "@/components/fields";
import { useCloseFormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createDestination } from "@/lib/actions/destinations";
import { useT } from "@/i18n/client";
import type { PlaceResult } from "@/lib/places";

export function DestinationForm({
  tripId,
  startDate,
  endDate,
  dateHint,
}: {
  tripId: string;
  startDate: string;
  endDate: string;
  dateHint: string;
}) {
  const t = useT("map");
  const tCommon = useT("common");
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [manual, setManual] = useState(false);
  const [rename, setRename] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState(async (previous: unknown, formData: FormData) => {
    const result = await createDestination(tripId, previous, formData);
    if (result.ok) {
      setPlace(null);
      setManual(false);
      setRename(false);
      setFormKey((key) => key + 1);
    }
    return result;
  }, null);
  const usingPlace = place !== null && !manual;
  const closeDialog = useCloseFormDialog();
  useEffect(() => {
    if (state?.ok) closeDialog?.();
  }, [state, closeDialog]);

  return (
    <form action={formAction} className="grid gap-3">
      <div key={formKey} className="grid gap-3">
      <div className="grid gap-1.5">
        <span className="text-sm leading-none font-medium">{t("form.place")}</span>
        <PlaceSearch
          onPick={(picked) => {
            setPlace(picked);
            setManual(false);
            setRename(false);
          }}
        />
      </div>

      {usingPlace ? (
        <div className="grid gap-2 rounded-lg bg-muted px-3 py-2.5">
          <div>
            <p className="font-medium">{place.name}</p>
            {place.address && place.address !== place.name ? (
              <p className="text-sm text-muted-foreground">{place.address}</p>
            ) : null}
          </div>
          <input type="hidden" name="placeId" value={place.placeId} />
          <input type="hidden" name="address" value={place.address} />
          <input type="hidden" name="lat" value={String(place.lat)} />
          <input type="hidden" name="lng" value={String(place.lng)} />
          {rename ? (
            <Field label={t("form.name")}>
              <Input name="name" defaultValue={place.name} required />
            </Field>
          ) : (
            <input type="hidden" name="name" value={place.name} />
          )}
          <div className="flex gap-2">
            {rename ? null : (
              <Button type="button" variant="ghost" size="sm" onClick={() => setRename(true)}>
                {t("form.rename")}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPlace(null);
                setRename(false);
              }}
            >
              {t("form.clear")}
            </Button>
          </div>
        </div>
      ) : manual ? (
        <>
          <Field label={t("form.name")}>
            <Input name="name" defaultValue={place?.name ?? ""} required />
          </Field>
          <Field label={t("form.address")}>
            <Input name="address" defaultValue={place?.address ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("form.latitude")}>
              <Input name="lat" defaultValue={place ? String(place.lat) : ""} required />
            </Field>
            <Field label={t("form.longitude")}>
              <Input name="lng" defaultValue={place ? String(place.lng) : ""} required />
            </Field>
          </div>
          {place ? (
            <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => setManual(false)}>
              {t("form.usePlace", { name: place.name })}
            </Button>
          ) : null}
        </>
      ) : (
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">{t("form.searchHint")}</p>
          <Button type="button" variant="outline" className="justify-self-start" onClick={() => setManual(true)}>
            {t("form.enterYourself")}
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("form.firstDay")}>
          <Input name="startDate" type="date" defaultValue={startDate} required />
        </Field>
        <Field label={t("form.lastDay")}>
          <Input name="endDate" type="date" defaultValue={endDate} required />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">{dateHint}</p>
      <Field label={t("form.note")}>
        <Textarea name="notes" rows={2} placeholder={t("form.optional")} />
      </Field>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? tCommon("saving") : t("form.addDestination")}
      </Button>
    </form>
  );
}
