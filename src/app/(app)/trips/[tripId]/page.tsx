import Link from "next/link";
import { Pencil, UserPlus } from "lucide-react";
import { ActionForm, InlineAction } from "@/components/action-form";
import { BalanceSummary } from "@/components/balance-summary";
import { FlagStack } from "@/components/country-flag";
import { CountriesPicker } from "@/components/countries-picker";
import { DestinationRow } from "@/components/destination-card";
import { Field, FieldGroup } from "@/components/fields";
import { FormDialog } from "@/components/form-dialog";
import { MemberMenu } from "@/components/member-menu";
import { MemberTag } from "@/components/member-tag";
import { ShareJoinLinkButton } from "@/components/share-trip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getT } from "@/i18n/server";
import { countryList } from "@/lib/account-details";
import { formatDate, formatDateLong, formatDateRange } from "@/lib/dates";
import { tripJoinUrl } from "@/lib/join-url";
import { netBalances } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { acceptedMembers, requireTrip } from "@/lib/trip-access";
import { createInvite, deleteTrip, makeAdmin, removeMember, updateTrip } from "@/lib/actions/trips";
import { deleteDestination } from "@/lib/actions/destinations";

export default async function TripOverviewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const { trip, membership } = await requireTrip(tripId);
  const t = await getT("trips");
  const locale = t.locale;
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

  const dateHint = t("overview.dateHint", {
    start: formatDateLong(trip.startDate, locale),
    end: formatDateLong(trip.endDate, locale),
  });
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
          <CardTitle>{t("overview.travelers")}</CardTitle>
          <CardDescription>
            {membership.role === "ADMIN"
              ? t("overview.travelersAdminHint")
              : t("overview.travelersHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <ul className="grid grid-cols-1 gap-2">
            {members.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
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
                  <Badge variant="secondary">{member.role === "ADMIN" ? t("roles.admin") : t("roles.traveler")}</Badge>
                  {membership.role === "ADMIN" && member.role !== "ADMIN" ? (
                    <MemberMenu
                      name={member.user.name ?? member.user.email}
                      makeAdmin={makeAdmin.bind(null, tripId, member.userId)}
                      remove={removeMember.bind(null, tripId, member.userId)}
                    />
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {membership.role === "ADMIN" ? (
            <FormDialog
              title={t("overview.inviteTitle")}
              description={t("overview.inviteDescription")}
              triggerLabel={t("overview.inviteTrigger")}
              icon={<UserPlus />}
              triggerVariant="outline"
              triggerClassName="w-full"
            >
              <ActionForm
                action={createInvite.bind(null, tripId)}
                submitLabel={t("overview.inviteSubmit")}
                submitIcon={<UserPlus />}
              >
                <Field label={t("overview.theirEmail")}>
                  <Input name="email" type="email" placeholder={t("overview.emailPlaceholder")} dir="ltr" required />
                </Field>
              </ActionForm>
            </FormDialog>
          ) : null}
          <div className="grid gap-2">
            {membership.role === "ADMIN" ? (
              <p className="text-sm text-muted-foreground">{t("overview.orShare")}</p>
            ) : null}
            <ShareJoinLinkButton name={trip.name} url={tripJoinUrl(trip.joinToken)} label={t("overview.shareJoinLink")} />
          </div>
          {membership.role === "ADMIN" && invites.length > 0 ? (
            <div className="grid gap-1 text-sm text-muted-foreground">
              {invites.map((invite) => (
                <p key={invite.id} className="break-all">
                  {t("overview.pendingInvite", { email: invite.email, link: `/invite/${invite.token}` })}
                </p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("overview.details")}</CardTitle>
          {trip.coverNote ? <CardDescription>{trip.coverNote}</CardDescription> : null}
        </CardHeader>
        <CardContent className="grid gap-4">
          <dl className="grid gap-3 text-sm">
            <div className="grid gap-0.5">
              <dt className="text-muted-foreground">{t("overview.dates")}</dt>
              <dd>{formatDateRange(trip.startDate, trip.endDate, locale)}</dd>
            </div>
            {trip.countries.length > 0 ? (
              <div className="grid gap-1">
                <dt className="text-muted-foreground">{t("overview.countries")}</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  <FlagStack codes={trip.countries} label={countryList(trip.countries, locale)} />
                  <span>{countryList(trip.countries, locale)}</span>
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="grid gap-2">
            <FormDialog
              title={t("overview.editTitle")}
              icon={<Pencil />}
              triggerLabel={t("overview.editTrigger")}
              triggerVariant="outline"
              triggerClassName="w-full"
            >
              <ActionForm action={updateTrip.bind(null, tripId)} submitLabel={t("overview.saveDetails")}>
                <Field label={t("overview.name")}>
                  <Input name="name" defaultValue={trip.name} required />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("dates.start")}>
                    <Input name="startDate" type="date" defaultValue={formatDate(trip.startDate)} required />
                  </Field>
                  <Field label={t("dates.end")}>
                    <Input name="endDate" type="date" defaultValue={formatDate(trip.endDate)} required />
                  </Field>
                </div>
                <FieldGroup label={t("overview.countries")}>
                  <CountriesPicker defaultValue={trip.countries} />
                </FieldGroup>
                <Field label={t("overview.note")}>
                  <Textarea name="coverNote" defaultValue={trip.coverNote ?? ""} rows={3} />
                </Field>
              </ActionForm>
            </FormDialog>
            {membership.role === "ADMIN" ? (
              <InlineAction
                action={deleteTrip.bind(null, tripId)}
                label={t("overview.deleteTrip")}
                variant="destructive"
                confirmMessage={t("overview.confirmDelete", { name: trip.name })}
                fullWidth
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("overview.destinations")}</CardTitle>
        </CardHeader>
        <CardContent>
          {destinations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.rich("overview.noDestinations", {
                link: (chunks) => (
                  <Link href={`/trips/${tripId}/map`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {destinations.map((destination) => (
                <DestinationRow
                  key={destination.id}
                  tripId={tripId}
                  dates={formatDateRange(destination.startDate, destination.endDate, locale)}
                  dateHint={dateHint}
                  remove={deleteDestination.bind(null, tripId, destination.id)}
                  destination={{
                    id: destination.id,
                    name: destination.name,
                    address: destination.address,
                    placeId: destination.placeId,
                    lat: destination.lat,
                    lng: destination.lng,
                    startDate: formatDate(destination.startDate),
                    endDate: formatDate(destination.endDate),
                    notes: destination.notes,
                  }}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("overview.balances")}</CardTitle>
          <CardDescription>{t("overview.balancesHint", { currency: trip.baseCurrency })}</CardDescription>
        </CardHeader>
        <CardContent>
          <BalanceSummary currency={trip.baseCurrency} people={people} balances={balances} viewerId={membership.userId} />
        </CardContent>
      </Card>

    </div>
  );
}
