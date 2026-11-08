import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { LanguagePicker } from "@/components/language-picker";
import { Avatar } from "@/components/avatar";
import { CountryFlag, FlagStack } from "@/components/country-flag";
import { PendingInvites } from "@/components/pending-invites";
import { ProfileEditor } from "@/components/profile-editor";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/i18n/server";
import { countryList, countryName, formatPhone } from "@/lib/account-details";
import { formatDate, formatDateRange, formatDateText, formatMonthYear } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/trip-access";
import { notFound } from "next/navigation";

function Detail({
  label,
  value,
  empty,
  className,
}: {
  label: string;
  value: string | null;
  empty: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={value ? "text-sm" : "text-sm text-muted-foreground"}>{value ?? empty}</p>
    </div>
  );
}

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const t = await getT("profile");
  const tAccount = await getT("account");
  const tCommon = await getT("common");
  const { locale } = t;
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      imageKey: true,
      passwordHash: true,
      gender: true,
      birthDate: true,
      phone: true,
      country: true,
      address: true,
      city: true,
      postalCode: true,
      createdAt: true,
      memberships: {
        where: { status: "ACCEPTED" },
        include: {
          trip: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              countries: true,
            },
          },
        },
        orderBy: { trip: { startDate: "asc" } },
      },
    },
  });
  if (!user) notFound();

  const joined = formatMonthYear(user.createdAt, locale);
  const notSet = t("notSet");

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("intro")}
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4 text-start sm:flex-row sm:items-center">
              <Avatar name={user.name} userId={user.id} imageKey={user.imageKey} size="lg" />
              <div className="grid min-w-0 gap-1">
                <p className="text-lg font-medium break-words">{user.name}</p>
                <p className="text-sm break-all text-muted-foreground">{user.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{user.passwordHash ? t("signInPassword") : t("signInGoogle")}</Badge>
                  <span className="text-xs text-muted-foreground">{t("joined", { date: joined })}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ProfileEditor
                defaults={{
                  name: user.name,
                  gender: user.gender,
                  birthDate: user.birthDate ? formatDate(user.birthDate) : "",
                  phone: user.phone,
                  country: user.country,
                  address: user.address,
                  city: user.city,
                  postalCode: user.postalCode,
                }}
              />
              <AccountMenu hasPassword={Boolean(user.passwordHash)} />
            </div>
          </div>
          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
            <Detail label={t("gender")} empty={notSet} value={user.gender ? t.dynamic(`genders.${user.gender}`) : null} />
            <Detail
              label={t("birthDate")}
              empty={notSet}
              value={user.birthDate ? formatDateText(user.birthDate, locale) : null}
            />
            <div>
              <p className="text-xs text-muted-foreground">{t("phone")}</p>
              <p dir="ltr" className={user.phone ? "text-start text-sm" : "text-start text-sm text-muted-foreground"}>
                {formatPhone(user.phone, user.country) ?? notSet}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("country")}</p>
              {user.country ? (
                <p className="flex items-center gap-2 text-sm">
                  <CountryFlag code={user.country} />
                  {countryName(user.country, locale)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{notSet}</p>
              )}
            </div>
            <Detail
              empty={notSet}
              label={t("address")}
              value={[user.address, [user.city, user.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ") || null}
              className="sm:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
          <CardDescription>{tAccount("languageHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguagePicker className="sm:max-w-xs" />
        </CardContent>
      </Card>

      <PendingInvites userId={user.id} />

      <Card>
        <CardHeader>
          <CardTitle>{t("trips")}</CardTitle>
          <CardDescription>{t("tripsHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {user.memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noTrips")}{" "}
              <Link href="/trips" className="text-foreground underline">
                {t("goToTrips")}
              </Link>
            </p>
          ) : (
            <ul className="grid gap-2">
              {user.memberships.map((membership) => {
                const countries = membership.trip.countries;
                return (
                  <li key={membership.id}>
                    <Link
                      href={`/trips/${membership.trip.id}`}
                      className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-3 py-2 hover:bg-muted sm:flex-row sm:items-center sm:justify-between sm:gap-2"
                    >
                      <span className="grid min-w-0 justify-items-start gap-0.5">
                        <span className="break-words font-medium">{membership.trip.name}</span>
                        {countries.length > 0 ? (
                          <FlagStack codes={countries} label={countryList(countries, locale)} size="sm" />
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDateRange(membership.trip.startDate, membership.trip.endDate, locale)}
                        </span>
                        <Badge variant="secondary">{membership.role === "ADMIN" ? t("admin") : t("traveler")}</Badge>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-2 sm:flex sm:items-center">
        <Button
          nativeButton={false}
          variant="outline"
          className="h-11 w-full gap-2 px-4 text-base sm:h-9 sm:w-auto sm:text-sm"
          render={<Link href="/how-it-works" />}
        >
          <CircleHelp />
          {t("howDuffleWorks")}
        </Button>
        <SignOutButton label={tCommon("logOut")} className="h-11 w-full px-4 text-base sm:h-9 sm:w-auto sm:text-sm" />
      </div>
    </div>
  );
}
