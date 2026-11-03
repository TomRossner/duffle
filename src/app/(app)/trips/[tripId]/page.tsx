import { ActionForm, InlineAction } from "@/components/action-form";
import { BalanceSummary } from "@/components/balance-summary";
import { PlaceLinks } from "@/components/place-links";
import { Field } from "@/components/fields";
import { MemberTag } from "@/components/member-tag";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateRange } from "@/lib/dates";
import { netBalances } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";
import { createInvite, deleteTrip, makeAdmin, removeMember, updateTrip } from "@/lib/actions/trips";

export default async function TripOverviewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip, membership } = await requireTrip(tripId);
  const [members, invites, destinations, expenses] = await Promise.all([
    acceptedMembers(tripId),
    prisma.tripInvite.findMany({
      where: { tripId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.destination.findMany({ where: { tripId }, orderBy: [{ startDate: "asc" }, { endDate: "asc" }, { sortOrder: "asc" }] }),
    prisma.expense.findMany({
      where: { tripId, OR: [{ phase: "ACTUAL" }, { phase: "PLANNED", paid: true }] },
      include: { shares: true },
    }),
  ]);

  const people = members.map((member) => ({
    id: member.userId,
    name: member.user.name.trim().split(/\s+/)[0] || member.user.name,
    imageKey: member.user.imageKey,
  }));
  const balances = netBalances(
    expenses.map((expense) => ({
      paidById: expense.paidById,
      amountInBase: Number(expense.amountInBase),
      fxRate: Number(expense.fxRate),
      shares: expense.shares.map((share) => ({ userId: share.userId, amount: Number(share.amount) })),
    })),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Travelers</CardTitle>
          <CardDescription>
            {membership.role === "ADMIN"
              ? "Invite people with the email they will use to sign in, or share the join link."
              : "People on this trip. Anyone with the join link can become a traveler."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ul className="grid gap-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-1.5">
                  <MemberTag
                    userId={member.userId}
                    name={member.user.name}
                    imageKey={member.user.imageKey}
                    className="shrink-0"
                  />
                  <span className="truncate text-muted-foreground">{member.user.email}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{member.role === "ADMIN" ? "Admin" : "Traveler"}</Badge>
                  {membership.role === "ADMIN" && member.role !== "ADMIN" ? (
                    <>
                      <InlineAction action={makeAdmin.bind(null, tripId, member.userId)} label="Make admin" />
                      <InlineAction action={removeMember.bind(null, tripId, member.userId)} label="Remove" />
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {membership.role === "ADMIN" ? (
            <ActionForm action={createInvite.bind(null, tripId)} submitLabel="Create invite link">
              <Field label="Email">
                <Input name="email" type="email" required />
              </Field>
            </ActionForm>
          ) : null}
          {membership.role === "ADMIN" && invites.length > 0 ? (
            <div className="grid gap-1 text-sm text-muted-foreground">
              {invites.map((invite) => (
                <p key={invite.id} className="break-all">
                  Pending invite for {invite.email}. Link: /invite/{invite.token}
                </p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trip details</CardTitle>
          {trip.coverNote ? <CardDescription>{trip.coverNote}</CardDescription> : null}
        </CardHeader>
        <CardContent className="grid gap-4">
          <ActionForm action={updateTrip.bind(null, tripId)} submitLabel="Save details">
              <Field label="Name">
                <Input name="name" defaultValue={trip.name} required />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Start">
                  <Input name="startDate" type="date" defaultValue={formatDate(trip.startDate)} required />
                </Field>
                <Field label="End">
                  <Input name="endDate" type="date" defaultValue={formatDate(trip.endDate)} required />
                </Field>
              </div>
              <Field label="Note">
                <Textarea name="coverNote" defaultValue={trip.coverNote ?? ""} rows={3} />
              </Field>
            </ActionForm>
          {membership.role === "ADMIN" ? (
            <InlineAction
              action={deleteTrip.bind(null, tripId)}
              label="Delete trip"
              variant="destructive"
              confirmMessage={`Are you sure you want to delete "${trip.name}"?`}
              fullWidthOnMobile
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Destinations</CardTitle>
        </CardHeader>
        <CardContent>
          {destinations.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet. Add them on the map.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {destinations.map((destination) => (
                <li key={destination.id} className="grid gap-1.5 rounded-lg bg-muted/60 px-3 py-2">
                  <p>
                    <span className="font-medium">{destination.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {formatDateRange(destination.startDate, destination.endDate)}
                    </span>
                  </p>
                  <PlaceLinks
                    place={{
                      name: destination.name,
                      address: destination.address,
                      placeId: destination.placeId,
                      lat: destination.lat,
                      lng: destination.lng,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mid-trip balances</CardTitle>
          <CardDescription>Who still needs to pay whom, in {trip.baseCurrency}.</CardDescription>
        </CardHeader>
        <CardContent>
          <BalanceSummary currency={trip.baseCurrency} people={people} balances={balances} />
        </CardContent>
      </Card>

    </div>
  );
}
