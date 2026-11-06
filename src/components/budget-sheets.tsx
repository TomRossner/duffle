"use client";

import { Menu } from "@base-ui/react/menu";
import { EllipsisVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ActionForm } from "@/components/action-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { CurrencySelect, Field, Select } from "@/components/fields";
import { MemberTag } from "@/components/member-tag";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none data-highlighted:bg-accent";

function rowWhen(row: BudgetRowView) {
  if (!row.startDate) return null;
  const start = formatDateLong(new Date(`${row.startDate}T00:00:00.000Z`));
  if (!row.endDate || row.startDate === row.endDate) return start;
  return `${start} – ${formatDateLong(new Date(`${row.endDate}T00:00:00.000Z`))}`;
}

function ActionMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Menu.Root>
      <Menu.Trigger className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={label}>
        <EllipsisVertical />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
          <Menu.Popup className="min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none">
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function ImportExcelButton({ tripId }: { tripId: string }) {
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
        {pending ? "Reading the file..." : "Import Excel"}
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
                setDone(`Added ${result.count} ${result.count === 1 ? "table" : "tables"} from ${file.name}.`);
              }
            })
            .catch(() => setError("Could not import that file."))
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
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input name="label" required defaultValue={row?.label} />
        </Field>
        <Field label="Amount">
          <Input name="amount" type="number" min="0.01" step="0.01" required defaultValue={row?.amount} />
        </Field>
        <Field label="Paid by">
          <Select name="paidById" defaultValue={row?.paidBy?.id ?? ""}>
            <option value="">—</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes">
          <Textarea name="note" defaultValue={row?.note ?? ""} rows={2} />
        </Field>
        <Field label="From">
          <Input name="startDate" type="date" defaultValue={row?.startDate ?? ""} />
        </Field>
        <Field label="Until">
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
  const [adding, setAdding] = useState(false);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [addingRowTo, setAddingRowTo] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<null | { message: string; run: () => void }>(null);

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-base font-medium">Budget sheets</h2>
        <p className="text-sm text-muted-foreground">
          Group costs into boxes, like a spreadsheet. Each box keeps its own rows and a total.
        </p>
      </div>
      <div className="grid grid-cols-2 items-start gap-2 sm:flex sm:flex-wrap">
        <Button type="button" onClick={() => setAdding((open) => !open)}>
          Add a table
        </Button>
        <ImportExcelButton tripId={tripId} />
      </div>
      {adding ? (
        <Card>
          <CardHeader>
            <CardTitle>Add a table</CardTitle>
            <CardDescription>Give it a name and a currency.</CardDescription>
            <CardAction>
              <Button type="button" variant="outline" size="sm" onClick={() => setAdding(false)}>
                Close
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ActionForm action={createBudgetTable.bind(null, tripId)} submitLabel="Add table" onSaved={() => setAdding(false)}>
              <Field label="Name">
                <Input name="title" placeholder="Flights" />
              </Field>
              <Field label="Currency">
                <CurrencySelect name="currency" defaultValue={currency} withSymbols />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      ) : null}
      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sheets yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tables.map((table) => {
            const total = table.rows.reduce((sum, row) => sum + row.amount, 0);
            return (
              <Card key={table.id}>
                <CardHeader>
                  <CardTitle>{table.title}</CardTitle>
                  <CardAction>
                    <ActionMenu label={`Actions for ${table.title}`}>
                      <Menu.Item className={menuItemClass} onClick={() => setEditingTable(table.id)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        className={`${menuItemClass} text-destructive`}
                        onClick={() =>
                          setPendingDelete({
                            message: `Are you sure you want to delete "${table.title}"?`,
                            run: () => void deleteBudgetTable(tripId, table.id),
                          })
                        }
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Menu.Item>
                    </ActionMenu>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {editingTable === table.id ? (
                    <ActionForm
                      action={updateBudgetTable.bind(null, tripId, table.id)}
                      submitLabel="Save"
                      onSaved={() => setEditingTable(null)}
                    >
                      <Field label="Name">
                        <Input name="title" defaultValue={table.title} />
                      </Field>
                      <Field label="Currency">
                        <CurrencySelect name="currency" defaultValue={table.currency} withSymbols />
                      </Field>
                      <Button type="button" variant="outline" onClick={() => setEditingTable(null)}>
                        Cancel
                      </Button>
                    </ActionForm>
                  ) : null}
                  {table.rows.length === 0 ? <p className="text-sm text-muted-foreground">No rows yet.</p> : null}
                  <ul className="grid">
                    {table.rows.map((row) => (
                      <li key={row.id} className="grid gap-2 border-t py-2 first:border-t-0">
                        {editingRow === row.id ? (
                          <ActionForm
                            action={updateBudgetRow.bind(null, tripId, row.id)}
                            submitLabel="Save"
                            onSaved={() => setEditingRow(null)}
                          >
                            <RowFields row={row} members={members} />
                            <Button type="button" variant="outline" onClick={() => setEditingRow(null)}>
                              Cancel
                            </Button>
                          </ActionForm>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium">{row.label}</p>
                              {rowWhen(row) ? <p className="text-xs text-muted-foreground">{rowWhen(row)}</p> : null}
                              {row.paidBy ? (
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                  Paid by
                                  <MemberTag userId={row.paidBy.id} name={row.paidBy.name} imageKey={row.paidBy.imageKey} />
                                </p>
                              ) : null}
                              {row.note ? <p className="text-xs text-muted-foreground">{row.note}</p> : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <span className="text-sm">{formatMoney(row.amount, table.currency)}</span>
                              <ActionMenu label={`Actions for ${row.label}`}>
                                <Menu.Item className={menuItemClass} onClick={() => setEditingRow(row.id)}>
                                  <Pencil className="size-3.5" />
                                  Edit
                                </Menu.Item>
                                <Menu.Item
                                  className={`${menuItemClass} text-destructive`}
                                  onClick={() =>
                                    setPendingDelete({
                                      message: `Are you sure you want to delete "${row.label}"?`,
                                      run: () => void deleteBudgetRow(tripId, row.id),
                                    })
                                  }
                                >
                                  <Trash2 className="size-3.5" />
                                  Delete
                                </Menu.Item>
                              </ActionMenu>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
                    <span>Total</span>
                    <span>{formatMoney(total, table.currency)}</span>
                  </div>
                  {addingRowTo === table.id ? (
                    <ActionForm
                      action={addBudgetRow.bind(null, tripId, table.id)}
                      submitLabel="Add row"
                      onSaved={() => setAddingRowTo(null)}
                    >
                      <RowFields members={members} />
                      <Button type="button" variant="outline" onClick={() => setAddingRowTo(null)}>
                        Cancel
                      </Button>
                    </ActionForm>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto sm:justify-self-start"
                      onClick={() => setAddingRowTo(table.id)}
                    >
                      <Plus />
                      Add row
                    </Button>
                  )}
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
