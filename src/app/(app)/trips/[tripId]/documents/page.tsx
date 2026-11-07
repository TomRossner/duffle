import Link from "next/link";
import { Check, ChevronDown, FileImage, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { DocumentCard } from "@/components/document-card";
import { EmptyState } from "@/components/empty-state";
import { DocumentFormToggle } from "@/components/document-form";
import { AttachedPersonalDocumentCard, BringDocuments } from "@/components/personal-documents";
import { buttonVariants } from "@/components/ui/button";
import { personalDocumentLabel } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { bringDocumentsCopy, suggestedPersonalKinds, tripCountryScope } from "@/lib/personal-documents";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { tripId } = await params;
  const { type } = await searchParams;
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
  const memberOptions = members.map((member) => ({ id: member.userId, name: member.user.name }));
  const showPrompt = personalDocuments.length === 0 || unattached.length > 0;

  // Types present on this trip, for the filter, with how many of each.
  const typeCounts = new Map<string, number>();
  for (const kind of [
    ...attachments.map((attachment) => attachment.personalDocument.kind),
    ...documents.map((document) => document.kind),
  ]) {
    typeCounts.set(kind, (typeCounts.get(kind) ?? 0) + 1);
  }
  const types = [...typeCounts.entries()]
    .map(([kind, count]) => ({ kind, count, label: personalDocumentLabel(kind) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  // Several types can be selected at once: ?type=PASSPORT,TICKET
  const activeTypes = new Set(
    (Array.isArray(type) ? type.join(",") : (type ?? ""))
      .split(",")
      .filter((kind) => typeCounts.has(kind)),
  );
  const filtering = activeTypes.size > 0;
  const matches = (kind: string) => !filtering || activeTypes.has(kind);
  const matchCount = filtering
    ? [...activeTypes].reduce((sum, kind) => sum + (typeCounts.get(kind) ?? 0), 0)
    : attachments.length + documents.length;

  type Group = {
    id: string;
    name: string;
    imageKey: string | null;
    attachments: typeof attachments;
    documents: typeof documents;
  };
  const byUser = new Map<string, Group>();
  const groupFor = (person: { id: string; name: string; imageKey: string | null }) => {
    let group = byUser.get(person.id);
    if (!group) {
      group = { id: person.id, name: person.name, imageKey: person.imageKey, attachments: [], documents: [] };
      byUser.set(person.id, group);
    }
    return group;
  };
  for (const attachment of attachments) {
    if (matches(attachment.personalDocument.kind)) groupFor(attachment.personalDocument.user).attachments.push(attachment);
  }
  for (const document of documents) {
    if (matches(document.kind)) groupFor(document.user).documents.push(document);
  }
  const groups = [...byUser.values()].sort((a, b) =>
    a.id === user.id ? -1 : b.id === user.id ? 1 : a.name.localeCompare(b.name),
  );

  const filterHref = (kinds: string[]) =>
    kinds.length > 0
      ? `/trips/${tripId}/documents?type=${kinds.map(encodeURIComponent).join(",")}`
      : `/trips/${tripId}/documents`;
  // Clicking a type adds it to the selection, or removes it if already selected.
  const toggleHref = (kind: string) =>
    filterHref(
      activeTypes.has(kind) ? [...activeTypes].filter((entry) => entry !== kind) : [...activeTypes, kind],
    );
  const chipClass = (active: boolean) =>
    buttonVariants({ variant: active ? "default" : "outline", size: "sm", className: "rounded-full" });

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
      <DocumentFormToggle tripId={tripId} currentUserId={user.id} members={memberOptions} />
      {types.length > 0 ? (
        <nav aria-label="Filter by type" className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by type:</span>
          {types.map((entry) => (
            <Link
              key={entry.kind}
              href={toggleHref(entry.kind)}
              scroll={false}
              aria-pressed={activeTypes.has(entry.kind)}
              className={chipClass(activeTypes.has(entry.kind))}
            >
              {activeTypes.has(entry.kind) ? <Check /> : null}
              {entry.label} · {entry.count}
            </Link>
          ))}
          {filtering ? (
            <>
              <Link
                href={filterHref([])}
                scroll={false}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <X />
                Show all
              </Link>
              <span className="text-sm text-muted-foreground">
                Showing {matchCount} of {attachments.length + documents.length}
              </span>
            </>
          ) : null}
        </nav>
      ) : null}
      {groups.length === 0 ? (
        <EmptyState icon={FileImage} title="No documents yet">
          Keep tickets, bookings and confirmations here for the whole group. Your passport or ID stays private until
          you attach it to this trip.
        </EmptyState>
      ) : null}
      {groups.map((group) => (
        <details key={group.id} open className="group rounded-xl border bg-muted/40">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-3 text-sm font-medium select-none sm:p-4 [&::-webkit-details-marker]:hidden">
            <Avatar name={group.name} userId={group.id} imageKey={group.imageKey} size="md" />
            {group.id === user.id ? `${group.name} (you)` : group.name}
            <span className="font-normal text-muted-foreground">
              · {group.attachments.length + group.documents.length}
            </span>
            <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid auto-rows-fr gap-4 px-3 pb-3 sm:grid-cols-2 sm:px-4 sm:pb-4 lg:grid-cols-3">
            {group.attachments.map((attachment) => (
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
                  fullName: attachment.personalDocument.fullName,
                  documentNumber: attachment.personalDocument.documentNumber,
                  issuedOn: attachment.personalDocument.issuedOn ? formatDate(attachment.personalDocument.issuedOn) : null,
                  expiresOn: attachment.personalDocument.expiresOn ? formatDate(attachment.personalDocument.expiresOn) : null,
                }}
              />
            ))}
            {group.documents.map((document) => (
              <DocumentCard
                key={document.id}
                tripId={tripId}
                members={memberOptions}
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
        </details>
      ))}
    </div>
  );
}
