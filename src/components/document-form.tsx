"use client";

import { useCallback, useState } from "react";
import { FileImage, Upload } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Field, Select } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createDocument } from "@/lib/actions/documents";
import { DOCUMENT_KINDS } from "@/lib/constants";

export function DocumentFormToggle({
  tripId,
  currentUserId,
  members,
}: {
  tripId: string;
  currentUserId: string;
  members: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (!open) {
    return (
      <Button type="button" className="w-full sm:w-fit" onClick={() => setOpen(true)}>
        <FileImage />
        Add a document
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="size-5" />
          Add a document
        </CardTitle>
        <CardDescription>Tickets, bookings, and other files for this trip. Visible to everyone on the trip.</CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Close
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ActionForm action={createDocument.bind(null, tripId)} submitLabel="Upload" submitIcon={<Upload />} onSaved={close}>
          <Field label="Title">
            <Input name="title" required />
          </Field>
          <Field label="Type">
            <Select name="kind" defaultValue="TICKET">
              {DOCUMENT_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind.charAt(0) + kind.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Traveler">
            <Select name="userId" defaultValue={currentUserId}>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="File">
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
          </Field>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
