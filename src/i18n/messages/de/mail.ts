import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const mail: Translation<Messages["mail"]> = {
  buttonFallback: "Falls der Button nicht funktioniert, füge diesen Link in deinen Browser ein:",
  tagline: "Duffle · Die ganze Reise an einem Ort.",
  notConfigured: "Der E-Mail-Versand ist noch nicht eingerichtet.",
  sendFailed: "Die E-Mail konnte nicht gesendet werden. Versuche es erneut.",
  verify: {
    subject: "Bestätige dein Duffle-Konto",
    heading: "E-Mail bestätigen",
    body: "Willkommen bei Duffle! Bestätige {email}, um dein Konto fertig einzurichten.",
    action: "E-Mail bestätigen",
    note: "Dieser Link ist 24 Stunden gültig. Wenn du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.",
  },
  existing: {
    subject: "Dein Duffle-Konto",
    heading: "Du hast bereits ein Konto",
    google: "Das Konto für {email} meldet sich mit Google an. Melde dich mit Google an, um zu deinen Reisen zu kommen.",
    password: "Für {email} gibt es bereits ein Konto. Melde dich an oder setze das Passwort zurück, falls du es vergessen hast.",
    signInGoogle: "Mit Google anmelden",
    signIn: "Anmelden",
    resetPassword: "Passwort zurücksetzen",
    note: "Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren.",
  },
  reset: {
    subject: "Setze dein Duffle-Passwort zurück",
    heading: "Passwort zurücksetzen",
    body: "Wir haben eine Anfrage erhalten, das Passwort für {email} zurückzusetzen. Wähle unten ein neues.",
    action: "Passwort zurücksetzen",
    note: "Dieser Link ist eine Stunde gültig. Wenn du das nicht angefordert hast, ignoriere diese E-Mail – dein Passwort bleibt unverändert.",
  },
};

export default mail;
