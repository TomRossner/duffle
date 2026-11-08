import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const map: Translation<Messages["map"]> = {
  page: {
    heading: "Reiseziele",
    sub: "Jeder Halt ist ein Ort und die Tage, an denen ihr dort seid.",
    addTitle: "Reiseziel hinzufügen",
    addDescription: "Suche eine Stadt oder einen Ort und lege dann die Tage fest, an denen ihr dort seid.",
    emptyTitle: "Noch keine Reiseziele",
    emptyBody: "Füge jede Stadt oder jeden Halt der Reise mit Daten hinzu. Sie werden auf der Karte markiert, bekommen eine Wettervorhersage und sammeln die Aktivitäten, die ihr dort plant. Starte oben mit „Reiseziel hinzufügen“.",
    activities: "Aktivitäten",
    nothingHere: "An diesem Halt ist noch nichts geplant.",
  },
  form: {
    place: "Ort",
    name: "Name",
    rename: "Umbenennen",
    clear: "Entfernen",
    address: "Adresse",
    latitude: "Breitengrad",
    longitude: "Längengrad",
    usePlace: "{name} verwenden",
    searchHint: "Suche und wähle ein Ergebnis. Das setzt die Markierung.",
    enterYourself: "Ort selbst eingeben",
    firstDay: "Erster Tag",
    lastDay: "Letzter Tag",
    note: "Notiz",
    optional: "Optional",
    addDestination: "Reiseziel hinzufügen",
  },
  card: {
    confirmRemove: "Möchtest du {name} und die Aktivitäten dort wirklich entfernen?",
    editTitle: "{name} bearbeiten",
  },
  search: {
    placeholder: "Stadt oder Ort suchen",
    searching: "Suche läuft",
    search: "Suchen",
  },
  view: {
    noKey: "Füge GOOGLE_MAPS_API_KEY hinzu, um Google Maps anzuzeigen. Hinzugefügte Reiseziele werden trotzdem aufgelistet.",
    addOne: "Füge ein Reiseziel hinzu, um es auf der Karte zu sehen.",
    sketchNoKey: "Diese Skizze nutzt die gespeicherten Koordinaten. Google Maps lädt, sobald GOOGLE_MAPS_API_KEY gesetzt ist.",
    sketchFailed: "Google Maps wurde mit diesem Schlüssel nicht geladen. Die Reiseziele erscheinen weiter in dieser Skizze.",
  },
  errors: {
    signIn: "Melde dich an, um Orte zu suchen.",
    nameDestination: "Gib dem Reiseziel einen Namen.",
    choosePlace: "Wähle einen Ort aus der Suche oder gib seine Position ein.",
    chooseDates: "Wähle die Daten, an denen ihr dort seid.",
    lastAfterFirst: "Der letzte Tag muss am oder nach dem ersten Tag liegen.",
    insideTrip: "Die Daten des Reiseziels müssen innerhalb der Reise liegen.",
    destinationNotFound: "Reiseziel nicht gefunden.",
    nameActivity: "Gib der Aktivität einen Namen.",
    activityNotFound: "Aktivität nicht gefunden.",
    noKey: "Füge GOOGLE_MAPS_API_KEY hinzu, um Orte zu suchen. Name und Koordinaten kannst du trotzdem eingeben.",
    searchFailed: "Die Ortssuche ist fehlgeschlagen. Prüfe den Google-Maps-Schlüssel und die aktivierten APIs.",
  },
};

export default map;
