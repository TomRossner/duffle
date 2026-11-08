import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const auth: Translation<Messages["auth"]> = {
  home: "Duffle-Startseite",
  orEmail: "oder mit E-Mail fortfahren",
  continueGoogle: "Weiter mit Google",
  email: "E-Mail",
  password: "Passwort",
  confirmPassword: "Passwort bestätigen",
  newPassword: "Neues Passwort",
  name: "Name",
  emailPlaceholder: "name@beispiel.de",
  login: {
    title: "Willkommen zurück",
    description: "Melde dich an, um mit deiner Reisegruppe zu planen, zu packen und Kosten zu teilen.",
    noAccount: "Noch kein Konto? <link>Jetzt erstellen</link>",
    submit: "Anmelden",
    forgot: "Passwort vergessen?",
  },
  register: {
    title: "Konto erstellen",
    description: "Nutze Google oder gib deine Daten ein. Wir schicken dir einen Link, um deine Adresse zu bestätigen.",
    haveAccount: "Schon ein Konto? <link>Anmelden</link>",
    submit: "Konto erstellen",
    account: "Konto",
    aboutYou: "Über dich",
    passwordHint: "Mindestens 8 Zeichen.",
  },
  forgot: {
    title: "Passwort zurücksetzen",
    description: "Wir schicken einen Link, falls diese Adresse ein Passwort nutzt.",
    submit: "Link senden",
    backToSignIn: "Zurück zur Anmeldung",
  },
  reset: {
    title: "Neues Passwort wählen",
    description: "Dadurch werden auch alle anderen Sitzungen des Kontos abgemeldet.",
    submit: "Passwort speichern",
    missing: "Der Link zum Zurücksetzen fehlt.",
    requestNew: "Neuen Link anfordern",
  },
  verify: {
    title: "E-Mail bestätigen",
    description: "So zeigst du, dass die Adresse dir gehört, bevor du dich anmeldest oder einer Reise beitrittst.",
    submit: "E-Mail bestätigen",
    missing: "Der Bestätigungslink fehlt.",
  },
  google: {
    configuration: "Die Google-Anmeldung ist auf dem Server fehlgeschlagen. Versuche es erneut oder nutze E-Mail und Passwort.",
    accessDenied: "Google hat diese E-Mail-Adresse nicht bestätigt.",
    failed: "Die Google-Anmeldung ist fehlgeschlagen. Versuche es erneut.",
  },
  notices: {
    verified: "E-Mail bestätigt. Melde dich an.",
    password: "Passwort aktualisiert. Melde dich mit dem neuen an. Andere Sitzungen wurden abgemeldet.",
    reset: "Passwort aktualisiert. Melde dich mit dem neuen an.",
    confirm: "Bestätige deine E-Mail, bevor du einer Reise beitrittst.",
  },
  messages: {
    accountMail: "Sieh in deinen E-Mails nach. Wenn diese Adresse für ein Konto genutzt werden kann, haben wir einen Link geschickt.",
    resetSent: "Wenn diese E-Mail ein Konto mit Passwort hat, haben wir einen Link geschickt.",
  },
  errors: {
    nameShort: "Der Name muss mindestens 2 Zeichen lang sein.",
    email: "Gib eine gültige E-Mail ein.",
    passwordShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
    passwordMismatch: "Die Passwörter stimmen nicht überein.",
    passwordSame: "Wähle ein anderes Passwort.",
    passwordWrong: "Das aktuelle Passwort ist falsch.",
    googleAccount: "Dieses Konto meldet sich mit Google an.",
    noMailRegister: "Konten mit Passwort brauchen E-Mail-Versand. Melde dich mit Google an oder richte SMTP ein.",
    noMailReset: "Zum Zurücksetzen braucht es E-Mail-Versand. Richte SMTP ein oder melde dich mit Google an.",
    invalidLogin: "E-Mail oder Passwort ist falsch.",
    confirmFirst: "Bestätige deine E-Mail, bevor du dich anmeldest. Wir haben einen neuen Link geschickt.",
    linkInvalid: "Dieser Link ist ungültig oder abgelaufen.",
    tooMany: "Zu viele Versuche. Versuche es später erneut.",
    deleteFailed: "Das Konto konnte nicht gelöscht werden.",
  },
};

export default auth;
