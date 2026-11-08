import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const common: Translation<Messages["common"]> = {
  save: "Speichern",
  saving: "Wird gespeichert...",
  cancel: "Abbrechen",
  close: "Schließen",
  remove: "Entfernen",
  removing: "Wird entfernt...",
  edit: "Bearbeiten",
  delete: "Löschen",
  deleting: "Wird gelöscht...",
  back: "Zurück",
  tryAgain: "Erneut versuchen",
  goHome: "Zur Startseite",
  gotIt: "Verstanden",
  notAdded: "Nicht angegeben",
  copy: "Kopieren",
  copied: "Kopiert",
  actionsFor: "Aktionen für {name}",
  confirmRemove: "Möchtest du {name} wirklich entfernen?",
  openMenu: "Menü öffnen",
  closeMenu: "Menü schließen",
  signIn: "Anmelden",
  signUp: "Registrieren",
  signOut: "Abmelden",
  logOut: "Abmelden",
  you: "Du",
  language: "Sprache",
  or: "oder",
  and: "und",
  days: {
    one: "{count} Tag",
    other: "{count} Tage",
  },
  nights: {
    one: "{count} Nacht",
    other: "{count} Nächte",
  },
  travelers: {
    one: "{count} Reisende:r",
    other: "{count} Reisende",
  },
  cookies: {
    label: "Cookie-Hinweis",
    text: "Diese Website verwendet Cookies, damit du angemeldet bleibst und deine Einstellungen gespeichert werden.",
  },
  notFound: {
    title: "Seite nicht gefunden",
    heading: "Diese Seite ist nicht auf der Karte.",
    body: "Der Link ist vielleicht veraltet, oder die Seite wurde entfernt.",
  },
  error: {
    heading: "Etwas ist schiefgelaufen.",
    body: "Die Seite konnte nicht geladen werden. Versuche es noch einmal.",
    generic: "Etwas ist schiefgelaufen. Versuche es noch einmal.",
  },
};

export default common;
