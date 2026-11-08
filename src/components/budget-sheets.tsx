"use client";

import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical, Pencil, Plus, Sheet, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { FormDialog } from "@/components/form-dialog";
import { CurrencySelect, Field, Select } from "@/components/fields";
import { MemberTag } from "@/components/member-tag";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addBudgetRow,
  createBudgetTable,
  deleteBudgetRow,
  deleteBudgetTable,
  importBudgetWorkbook,
  updateBudgetRow,
  updateBudgetTable,
} from "@/lib/actions/budget-sheets";
import { useLocale, useT } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { formatDateLong } from "@/lib/dates";
import { formatMoney } from "@/lib/utils";

type Person = { id: string; name: string; imageKey?: string | null };

type BudgetRowView = {
  id: string;
  label: string;
  amount: number;
  note: string | null;
  startDate: string | null;
  endDate: string | null;
  paidBy: Person | null;
};

type BudgetTableView = {
  id: string;
  title: string;
  currency: string;
  rows: BudgetRowView[];
};

const menuItemClass =
  "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-base sm:gap-2 sm:px-2 sm:py-1.5 sm:text-sm [&_svg]:size-4 sm:[&_svg]:size-3.5 text-start outline-none data-highlighted:bg-accent";

function rowWhen(row: BudgetRowView, locale: Locale) {
  if (!row.startDate) return null;
  const start = formatDateLong(new Date(`${row.startDate}T00:00:00.000Z`), locale);
  if (!row.endDate || row.startDate === row.endDate) return start;
  return `${start} – ${formatDateLong(new Date(`${row.endDate}T00:00:00.000Z`), locale)}`;
}

function ActionMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Menu.Root>
      <Menu.Trigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={label}>
        <EllipsisVertical />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
          <Menu.Popup className="min-w-48 sm:min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ImportExcelButton({ tripId }: { tripId: string }) {
  const t = useT("money");
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="grid gap-1">
      <Button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? t("sheets.reading") : t("sheets.import")}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          const body = new FormData();
          body.set("file", file);
          setPending(true);
          setError(null);
          setDone(null);
          importBudgetWorkbook(tripId, null, body)
            .then((result) => {
              if ("error" in result && result.error) setError(result.error);
              else if ("count" in result && result.count) {
                setDone(t("sheets.imported", { count: result.count, file: file.name }));
              }
            })
            .catch(() => setError(t("sheets.importFailed")))
            .finally(() => setPending(false));
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {done ? <p className="text-sm text-muted-foreground">{done}</p> : null}
    </div>
  );
}

function RowFields({
  row,
  members,
}: {
  row?: BudgetRowView;
  members: Person[];
}) {
  const t = useT("money");
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("sheets.name")}>
          <Input name="label" required defaultValue={row?.label} />
        </Field>
        <Field label={t("form.amount")}>
          <Input name="amount" type="number" min="0.01" step="0.01" required defaultValue={row?.amount} />
        </Field>
        <Field label={t("form.paidBy")}>
          <Select name="paidById" defaultValue={row?.paidBy?.id ?? ""}>
            <option value="">—</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("form.notes")}>
          <Textarea name="note" defaultValue={row?.note ?? ""} rows={2} />
        </Field>
        <Field label={t("form.from")}>
          <Input name="startDate" type="date" defaultValue={row?.startDate ?? ""} />
        </Field>
        <Field label={t("sheets.until")}>
          <Input name="endDate" type="date" defaultValue={row?.endDate ?? ""} />
        </Field>
      </div>
    </>
  );
}

export function BudgetSheets({
  tripId,
  currency,
  members,
  tables,
}: {
  tripId: string;
  currency: string;
  members: Person[];
  tables: BudgetTableView[];
}) {
  const t = useT("money");
  const tCommon = useT("common");
  const locale = useLocale();
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<null | { message: string; run: () => void }>(null);

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-base font-medium">{t("sheets.heading")}</h2>
        <p className="text-sm text-muted-foreground">{t("sheets.hint")}</p>
      </div>
      <div className="grid grid-cols-2 items-start gap-2 sm:flex sm:flex-wrap">
        <FormDialog title={t("sheets.addTableTitle")} description={t("sheets.addTableDescription")}>
          <ActionForm action={createBudgetTable.bind(null, tripId)} submitLabel={t("sheets.addTable")}>
            <Field label={t("sheets.name")}>
              <Input name="title" placeholder={t("sheets.namePlaceholder")} />
            </Field>
            <Field label={t("sheets.currency")}>
              <CurrencySelect name="currency" defaultValue={currency} withSymbols />
            </Field>
          </ActionForm>
        </FormDialog>
        <ImportExcelButton tripId={tripId} />
      </div>
      {tables.length === 0 ? (
        <EmptyState icon={Sheet} title={t("sheets.emptyTitle")} compact>
          {t("sheets.emptyBody")}
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tables.map((table) => {
            const total = table.rows.reduce((sum, row) => sum + row.amount, 0);
            return (
              <Card key={table.id}>
                <CardHeader>
                  <CardTitle>{table.title}</CardTitle>
                  <CardAction>
                    <ActionMenu label={tCommon("actionsFor", { name: table.title })}>
                      <Menu.Item className={menuItemClass} onClick={() => setEditingTable(table.id)}>
                        <Pencil className="size-3.5" />
                        {tCommon("edit")}
                      </Menu.Item>
                      <Menu.Item
                        className={`${menuItemClass} text-destructive`}
                        onClick={() =>
                          setPendingDelete({
                            message: t("editor.confirmDelete", { title: table.title }),
                            run: () => void deleteBudgetTable(tripId, table.id),
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                        {tCommon("delete")}
                      </Menu.Item>
                    </ActionMenu>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <FormDialog
                    title={t("sheets.editTitle", { name: table.title })}
                    open={editingTable === table.id}
                    onOpenChange={(open) => setEditingTable(open ? table.id : null)}
                  >
                    <ActionForm action={updateBudgetTable.bind(null, tripId, table.id)} submitLabel={tCommon("save")}>
                      <Field label={t("sheets.name")}>
                        <Input name="title" defaultValue={table.title} />
                      </Field>
                      <Field label={t("sheets.currency")}>
                        <CurrencySelect name="currency" defaultValue={table.currency} withSymbols />
                      </Field>
                    </ActionForm>
                  </FormDialog>
                  {table.rows.length === 0 ? <p className="text-sm text-muted-foreground">{t("sheets.noRows")}</p> : null}
                  <ul className="grid">
                    {table.rows.map((row) => (
                      <li key={row.id} className="grid gap-2 border-t py-2 first:border-t-0">
                        <FormDialog
                          title={t("sheets.editTitle", { name: row.label })}
                          open={editingRow === row.id}
                          onOpenChange={(open) => setEditingRow(open ? row.id : null)}
                        >
                          <ActionForm action={updateBudgetRow.bind(null, tripId, row.id)} submitLabel={tCommon("save")}>
                            <RowFields row={row} members={members} />
                          </ActionForm>
                        </FormDialog>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium">{row.label}</p>
                              {rowWhen(row, locale) ? <p className="text-xs text-muted-foreground">{rowWhen(row, locale)}</p> : null}
                              {row.paidBy ? (
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                  {t("form.paidBy")}
                                  <MemberTag userId={row.paidBy.id} name={row.paidBy.name} imageKey={row.paidBy.imageKey} />
                                </p>
                              ) : null}
                              {row.note ? <p className="text-xs text-muted-foreground">{row.note}</p> : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <span className="text-sm">{formatMoney(row.amount, table.currency, locale)}</span>
                              <ActionMenu label={tCommon("actionsFor", { name: row.label })}>
                                <Menu.Item className={menuItemClass} onClick={() => setEditingRow(row.id)}>
                                  <Pencil className="size-3.5" />
                                  {tCommon("edit")}
                                </Menu.Item>
                                <Menu.Item
                                  className={`${menuItemClass} text-destructive`}
                                  onClick={() =>
                                    setPendingDelete({
                                      message: t("editor.confirmDelete", { title: row.label }),
                                      run: () => void deleteBudgetRow(tripId, row.id),
                                    })
                                  }
                                >
                                  <Trash2 className="size-3.5" />
                                  {tCommon("delete")}
                                </Menu.Item>
                              </ActionMenu>
                            </div>
                          </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
                    <span>{t("sheets.total")}</span>
                    <span>{formatMoney(total, table.currency, locale)}</span>
                  </div>
                  <FormDialog
                    title={t("sheets.addRowTitle", { table: table.title })}
                    triggerLabel={t("sheets.addRow")}
                    triggerIcon={<Plus />}
                    triggerVariant="outline"
                    triggerClassName="w-full sm:w-auto sm:justify-self-start"
                  >
                    <ActionForm action={addBudgetRow.bind(null, tripId, table.id)} submitLabel={t("sheets.addRow")}>
                      <RowFields members={members} />
                    </ActionForm>
                  </FormDialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <DeleteDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        message={pendingDelete?.message ?? ""}
        onConfirm={() => {
          const run = pendingDelete?.run;
          setPendingDelete(null);
          run?.();
        }}
      />
    </section>
  );
}
