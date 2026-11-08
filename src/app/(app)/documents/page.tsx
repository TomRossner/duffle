import { FileImage } from "lucide-react";
import { PersonalDocumentAddButton, PersonalDocumentCard } from "@/components/personal-documents";
import { getT } from "@/i18n/server";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";

export default async function DocumentsPage() {
  const sessionUser = await requireUser();
  const t = await getT("documents");
  const documents = await prisma.personalDocument.findMany({
    where: { userId: sessionUser.id },
    include: { attachments: { include: { trip: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("personal.heading")}</h1>
          <p className="text-sm text-muted-foreground">{t("personal.sub")}</p>
        </div>
        <PersonalDocumentAddButton />
      </div>
      {documents.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileImage className="size-4" />
          {t("personal.empty")}
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
                fullName: document.fullName,
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
