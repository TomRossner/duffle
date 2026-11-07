"use client";

import { FileImage, Upload } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Field, Select } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
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
  return (
    <FormDialog
      title="Add a document"
      description="Tickets, bookings, and other files for this trip. Visible to everyone on the trip."
      icon={<FileImage />}
      triggerClassName="w-full sm:w-fit"
    >
        <ActionForm action={createDocument.bind(null, tripId)} submitLabel="Upload" submitIcon={<Upload />}>
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
    </FormDialog>
  );
}
