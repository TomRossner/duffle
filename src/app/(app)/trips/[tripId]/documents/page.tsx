import { ActionForm } from "@/components/action-form";
import { DocumentCard } from "@/components/document-card";
import { AttachedPersonalDocumentCard, BringDocuments } from "@/components/personal-documents";
import { Field, Select } from "@/components/fields";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileImage, Upload } from "lucide-react";
import { createDocument } from "@/lib/actions/documents";
import { DOCUMENT_KINDS } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { bringDocumentsCopy, suggestedPersonalKinds, tripCountryScope } from "@/lib/personal-documents";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";

export default async function DocumentsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { user } = await requireTrip(tripId);
  const [members, documents, account, destinations, personalDocuments, attachments] = await Promise.all([
    acceptedMembers(tripId),
    prisma.document.findMany({
      where: { tripId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({ where: { id: user.id }, select: { country: true } }),
    prisma.destination.findMany({ where: { tripId }, select: { address: true } }),
    prisma.personalDocument.findMany({
      where: { userId: user.id },
      include: { attachments: { where: { tripId }, select: { id: true } } },
      orderBy: { title: "asc" },
    }),
    prisma.tripDocumentAttachment.findMany({
      where: { tripId },
      include: { personalDocument: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const scope = tripCountryScope(
    account?.country,
    destinations.map((destination) => destination.address),
  );
  const suggested = new Set(suggestedPersonalKinds(scope));
  const unattached = personalDocuments.filter((document) => document.attachments.length === 0);
  const showPrompt = personalDocuments.length === 0 || unattached.length > 0;

  return (
    <div className="grid gap-6">
      {showPrompt ? (
        <BringDocuments
          tripId={tripId}
          copy={bringDocumentsCopy(scope, account?.country)}
          documents={unattached.map((document) => ({
            id: document.id,
            title: document.title,
            kind: document.kind,
            suggested: suggested.has(document.kind),
          }))}
        />
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add a document</CardTitle>
          <CardDescription>Tickets, bookings, and other files for this trip. Visible to everyone on the trip.</CardDescription>
        </CardHeader>
        <CardContent>
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
              <Select name="userId" defaultValue={user.id}>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Image">
              <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
            </Field>
          </ActionForm>
        </CardContent>
      </Card>
      <div className="grid auto-rows-fr gap-4 self-stretch sm:grid-cols-2">
        {documents.length === 0 && attachments.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileImage className="size-4" />
            No documents yet.
          </p>
        ) : null}
        {attachments.map((attachment) => (
          <AttachedPersonalDocumentCard
            key={attachment.id}
            tripId={tripId}
            canDetach={attachment.personalDocument.userId === user.id}
            owner={{
              id: attachment.personalDocument.user.id,
              name: attachment.personalDocument.user.name,
              imageKey: attachment.personalDocument.user.imageKey,
            }}
            document={{
              id: attachment.personalDocument.id,
              title: attachment.personalDocument.title,
              kind: attachment.personalDocument.kind,
              storageKey: attachment.personalDocument.storageKey,
              mimeType: attachment.personalDocument.mimeType,
              documentNumber: attachment.personalDocument.documentNumber,
              issuedOn: attachment.personalDocument.issuedOn ? formatDate(attachment.personalDocument.issuedOn) : null,
              expiresOn: attachment.personalDocument.expiresOn ? formatDate(attachment.personalDocument.expiresOn) : null,
            }}
          />
        ))}
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            tripId={tripId}
            members={members.map((member) => ({ id: member.userId, name: member.user.name }))}
            document={{
              id: document.id,
              title: document.title,
              kind: document.kind,
              storageKey: document.storageKey,
              mimeType: document.mimeType,
              userId: document.userId,
              userName: document.user.name,
              userImageKey: document.user.imageKey,
            }}
          />
        ))}
      </div>
      </div>
    </div>
  );
}
