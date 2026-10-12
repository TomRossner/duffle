CREATE INDEX "TripInvite_email_idx" ON "TripInvite"("email");

CREATE UNIQUE INDEX "Notification_invite_once" ON "Notification" ("userId", "href") WHERE "kind" = 'INVITE';
