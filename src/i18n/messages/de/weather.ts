import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const weather: Translation<Messages["weather"]> = {
  heading: "Vorhersage",
  sub: "Tägliches Wetter von Open-Meteo für die Daten jedes Reiseziels.",
  emptyTitle: "Noch keine Vorhersage",
  addDestination: "Reiseziel hinzufügen",
  emptyBody: "Die Vorhersage folgt deinen Reisezielen. Füge die Orte, an die ihr reist, mit ihren Daten auf der Karte hinzu, und ihr tägliches Wetter erscheint hier.",
  noDays: "Noch keine Vorhersage. Nutze oben „Vorhersage laden“, sobald die Reise etwa zwei Wochen entfernt ist.",
  mm: "{value} mm",
  kmh: "{value} km/h",
  load: "Vorhersage laden",
  loading: "Vorhersage wird geladen...",
  saved: {
    one: "{count} Tag gespeichert.",
    other: "{count} Tage gespeichert.",
  },
  errors: {
    noDestinations: "Füge ein Reiseziel hinzu, bevor du das Wetter lädst.",
    tooEarly: "Für eine Vorhersage ist es noch zu früh. Schau etwa zwei Wochen vor der Reise wieder vorbei.",
    failed: "Die Vorhersage konnte gerade nicht geladen werden. Versuch es gleich noch einmal.",
  },
};

export default weather;
