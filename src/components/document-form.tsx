"use client";

import { FileImage, Upload } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Field, Select } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { createDocument } from "@/lib/actions/documents";
import { useT } from "@/i18n/client";
import { DOCUMENT_KINDS, documentKindLabel } from "@/lib/constants";

export function DocumentFormToggle({
  tripId,
  currentUserId,
  members,
}: {
  tripId: string;
  currentUserId: string;
  members: { id: string; name: string }[];
}) {
  const t = useT("documents");
  const tLabels = useT("labels");
  return (
    <FormDialog
      title={t("form.addTitle")}
      description={t("form.addDescription")}
      icon={<FileImage />}
      triggerClassName="w-full sm:w-fit"
    >
        <ActionForm action={createDocument.bind(null, tripId)} submitLabel={t("form.upload")} submitIcon={<Upload />}>
          <Field label={t("form.title")}>
            <Input name="title" required />
          </Field>
          <Field label={t("form.type")}>
            <Select name="kind" defaultValue="TICKET">
              {DOCUMENT_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {documentKindLabel(tLabels, kind)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("form.traveler")}>
            <Select name="userId" defaultValue={currentUserId}>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("form.file")}>
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
          </Field>
        </ActionForm>
    </FormDialog>
  );
}
