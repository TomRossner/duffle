import { InsuranceBoard } from "@/components/insurance-board";
import { getLocale } from "@/i18n/server";
import { formatDate, formatDateLong } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";

export default async function InsurancePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip, user } = await requireTrip(tripId);
  const locale = await getLocale();
  const [members, policies] = await Promise.all([
    acceptedMembers(tripId),
    prisma.insurancePolicy.findMany({
      where: { tripId },
      include: { user: true, document: true, expense: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <InsuranceBoard
      tripId={tripId}
      currency={trip.baseCurrency}
      defaultTravelerId={user.id}
      defaultStart={formatDate(trip.startDate)}
      defaultEnd={formatDate(trip.endDate)}
      members={members.map((member) => ({ id: member.userId, name: member.user.name }))}
      policies={policies.map((policy) => ({
        id: policy.id,
        provider: policy.provider,
        type: policy.type,
        policyNumber: policy.policyNumber,
        startDate: formatDate(policy.startDate),
        endDate: formatDate(policy.endDate),
        startLabel: formatDateLong(policy.startDate, locale),
        endLabel: formatDateLong(policy.endDate, locale),
        notes: policy.notes,
        userId: policy.userId,
        userName: policy.user.name,
        userImageKey: policy.user.imageKey,
        imageKey: policy.document?.storageKey ?? null,
        imageMimeType: policy.document?.mimeType ?? null,
        amount: policy.expense ? String(policy.expense.amount) : null,
        currency: policy.expense?.currency ?? null,
      }))}
    />
  );
}
