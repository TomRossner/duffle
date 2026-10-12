import { FileImage } from "lucide-react";
import { PersonalDocumentAddButton, PersonalDocumentCard } from "@/components/personal-documents";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";

export default async function DocumentsPage() {
  const sessionUser = await requireUser();
  const documents = await prisma.personalDocument.findMany({
    where: { userId: sessionUser.id },
    include: { attachments: { include: { trip: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Passports, IDs, and licenses stay here. Attach one to a trip only when that trip needs it.
          </p>
        </div>
        <PersonalDocumentAddButton />
      </div>
      {documents.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileImage className="size-4" />
          No documents yet.
        </p>
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <PersonalDocumentCard
              key={document.id}
              document={{
                id: document.id,
                title: document.title,
                kind: document.kind,
                storageKey: document.storageKey,
                mimeType: document.mimeType,
                documentNumber: document.documentNumber,
                issuedOn: document.issuedOn ? formatDate(document.issuedOn) : null,
                expiresOn: document.expiresOn ? formatDate(document.expiresOn) : null,
                trips: document.attachments.map((attachment) => ({
                  id: attachment.trip.id,
                  name: attachment.trip.name,
                })),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
