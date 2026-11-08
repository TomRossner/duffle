import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const closet: Translation<Messages["closet"]> = {
  title: "Kleiderschrank",
  subtitle: "Nur du siehst diese Teile. Reisen nutzen sie für Packvorschläge.",
  board: {
    search: "Suchen",
    searchPlaceholder: "Name oder Beschreibung",
    type: "Art",
    allTypes: "Alle Arten",
    empty: "Noch keine Teile.",
    noMatch: "Keine passenden Teile.",
    outerwear: "Oberbekleidung",
    accessories: "Accessoires",
  },
  fields: {
    name: "Name",
    type: "Art",
    quantity: "Anzahl",
    coolest: "Kühlste °C",
    warmest: "Wärmste °C",
    description: "Beschreibung",
    weather: "Wetter",
    activities: "Aktivitäten",
    features: "Eigenschaften",
  },
  card: {
    noTags: "Keine Tags",
    editTitle: "{name} bearbeiten",
    editDescription: "Ändere Art, Wetter oder Aktivitäten.",
    confirmDelete: "Möchtest du „{name}“ wirklich löschen?",
  },
  add: {
    button: "Teil hinzufügen",
    description: "Lege ein Foto ab, und die Angaben werden für dich ausgefüllt. Prüfe sie und speichere.",
    submit: "Zum Kleiderschrank hinzufügen",
  },
  image: {
    photo: "Foto",
    badType: "Verwende JPEG, PNG, WebP oder GIF.",
    tooBig: "Das Bild ist größer als 5 MB. Wähle eine kleinere Datei.",
    filled: "Die Angaben wurden aus dem Foto ausgefüllt. Prüfe sie vor dem Speichern.",
    kept: "Deine Eingaben wurden beibehalten.",
    fileMeta: "Bild · {size} · Klicken oder ablegen zum Ersetzen",
    prompt: "<em>Bild hochladen</em> oder hier ablegen",
    formats: "JPEG, PNG, WebP oder GIF, bis 5 MB.",
    autoFill: "Die Angaben werden für dich ausgefüllt.",
    reading: "Foto wird angesehen…",
    pasteUrl: "Oder füge eine Bild-URL ein",
    keepCurrent: "Lass beide Bildfelder leer, um das aktuelle Foto zu behalten.",
  },
  errors: {
    name: "Gib dem Teil einen Namen.",
    slot: "Wähle, welche Art Kleidung das ist.",
    quantity: "Die Anzahl muss eine ganze Zahl von 1 bis 99 sein.",
    imageUrl: "Die Bild-URL muss mit http:// oder https:// beginnen.",
    tempNumbers: "Der Temperaturbereich muss aus Zahlen bestehen.",
    tempOrder: "Der warme Wert muss mindestens so hoch wie der kühle sein.",
    chooseImage: "Wähle ein Bild.",
    notClothing: "Das sieht nicht nach Kleidung aus. Fülle die Angaben selbst aus.",
    readFailed: "Das Foto konnte nicht gelesen werden. Fülle die Angaben selbst aus.",
    notFound: "Teil nicht gefunden.",
  },
};

export default closet;
