import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const guide: Translation<Messages["guide"]> = {
  landing: {
    heading: "Ein Ort für die ganze Reise.",
    intro: "Teile eine Reise mit allen, die mitkommen. Karte, Wetter, Zeitplan, Dokumente, Versicherung, Packliste und wer wem was schuldet – alles an einem Ort.",
    register: "Konto erstellen",
    signIn: "Anmelden",
    features: "Funktionen",
    map: {
      title: "Karte",
      body: "Jeder Halt, markiert und geteilt.",
    },
    schedule: {
      title: "Zeitplan",
      body: "Ein Plan, den alle sehen.",
    },
    weather: {
      title: "Wetter",
      body: "Vorhersagen für dein Reiseziel.",
    },
    documents: {
      title: "Dokumente",
      body: "Pässe, Tickets und Versicherungen.",
    },
    packing: {
      title: "Packen",
      body: "Listen aus deinem Kleiderschrank.",
    },
    expenses: {
      title: "Ausgaben",
      body: "Behalte im Blick, wer wem was schuldet.",
    },
  },
  how: {
    metaTitle: "So funktioniert's",
    metaDescription: "Was jeder Teil von Duffle macht und wie du ihn nutzt.",
    heading: "So funktioniert Duffle",
    intro: "Duffle hält die ganze Reise für alle Mitreisenden an einem Ort: Plan, Wetter, Geld, Dokumente und Gepäck. Das macht jeder Teil.",
    gettingStarted: "Erste Schritte",
    steps: {
      create: {
        title: "Reise erstellen",
        body: "Gib ihr einen Namen, Daten, die Länder, die ihr besucht, und die Währung, in der die Gruppe plant.",
      },
      group: {
        title: "Hol die Gruppe dazu",
        body: "Lade per E-Mail ein oder teile einen Beitrittslink oder QR-Code. Alle mit einem Duffle-Konto können beitreten.",
      },
      plan: {
        title: "Gemeinsam planen",
        body: "Füge Ziele, Flüge, Unterkünfte und Aktivitäten hinzu. Alle arbeiten mit demselben Plan.",
      },
      pack: {
        title: "Packen und los",
        body: "Prüfe die Vorhersage, hänge deine Dokumente an und packe aus deinem Kleiderschrank mit Vorschlägen fürs Wetter.",
      },
    },
    insideTrip: "In einer Reise",
    insideTripBody: "Jede Reise hat diese Tabs. Alle Mitreisenden können sie sehen und bearbeiten.",
    trip: {
      overview: {
        title: "Übersicht",
        body: "Die Startseite der Reise: Daten, Länder, wer mitkommt und die Details.",
        p1: "Admins können die Details bearbeiten, Reisende einladen und die Reise löschen.",
        p2: "Offene Einladungen erscheinen auf deiner Reisen-Seite, bis du sie annimmst oder ablehnst.",
      },
      map: {
        title: "Karte",
        body: "Ziele mit Daten, Notizen und Aktivitäten auf einer gemeinsamen Karte.",
        p1: "Suche einen Ort nach Namen, um ihn zu markieren. Duffle schlägt ihn bei Google Maps nach.",
        p2: "Füge einem Ziel Aktivitäten hinzu und tagge sie, damit sie leicht zu überblicken sind.",
      },
      weather: {
        title: "Wetter",
        body: "Eine Tagesvorhersage für jedes Ziel: Temperatur, Regen, Wind und Wetterlage.",
        p1: "Kommende Tage nutzen die Vorhersage, vergangene das gemessene Wetter.",
        p2: "Packvorschläge nutzen dieselbe Vorhersage.",
      },
      schedule: {
        title: "Zeitplan",
        body: "Jeder Reisetag als Liste oder Kalender, mit Flügen und Plänen in Reihenfolge.",
        p1: "Pläne können Zeiten, Orte, Notizen und Tags haben, ganztägig sein oder sich an gewählten Wochentagen wiederholen.",
        p2: "Gib Flugnummer und Datum ein, und „Suchen“ füllt Airline, Flughäfen, Terminals und Zeiten aus. Ein Flug mit Zwischenstopp fügt jede Teilstrecke hinzu.",
        p3: "Duffle prüft kommende Flüge laufend und benachrichtigt alle an Bord, wenn sich Zeiten oder Terminals ändern.",
      },
      stays: {
        title: "Unterkünfte",
        body: "Hotels und Ferienwohnungen mit An- und Abreise, Adresse und Bestätigungsnummer.",
        p1: "Verknüpfe jede Unterkunft mit einem Ziel, damit sie bei diesem Halt steht.",
      },
      money: {
        title: "Geld",
        body: "Geteilte Ausgaben, Salden und Budgetblätter in der Reisewährung.",
        p1: "Füge eine Ausgabe hinzu, wähle, wer bezahlt hat, und teile gleichmäßig, nach Beträgen oder Prozent.",
        p2: "Zahle in einer anderen Währung, und Duffle rechnet zum Wechselkurs um.",
        p3: "Erfasse eine Zahlung, wenn jemand ausgleicht, und die Salden aktualisieren sich.",
        p4: "Budgetblätter planen Flüge, Unterkünfte, Autos und alles andere. Importiere sie aus Excel und mach aus einer Zeile eine echte Ausgabe, sobald sie bezahlt ist.",
      },
      documents: {
        title: "Dokumente",
        body: "Tickets, Buchungen und andere Dateien für die ganze Gruppe, dazu persönliche Dokumente der Reisenden.",
        p1: "Dein Pass und Ausweis werden nur geteilt, wenn du sie an diese Reise anhängst.",
      },
      insurance: {
        title: "Versicherung",
        body: "Die Police jeder Person: Versicherer, Daten, Nummer, Kosten und Datei.",
        p1: "Lade die Police hoch, und Duffle liest Versicherer, Daten, Nummer und Prämie aus.",
      },
      packing: {
        title: "Packen",
        body: "Deine Taschen und was hineinkommt, dazu eine gemeinsame Liste für die Gruppe.",
        p1: "Kleidungsvorschläge wählen Teile aus deinem Schrank passend zu Vorhersage und Tagesplänen und erklären, warum.",
        p2: "Zieh Teile zwischen Taschen und hake sie beim Packen ab.",
        p3: "Die gemeinsame Liste ist für Dinge, die die Gruppe zusammen mitbringt. Alle haken ihre eigene Kopie ab.",
      },
    },
    yourAccount: "In deinem Konto",
    yourAccountBody: "Diese gehören dir und begleiten dich auf jede Reise.",
    account: {
      closet: {
        title: "Kleiderschrank",
        body: "Deine Kleidung und Ausrüstung, mit Temperaturen, Wetter und Aktivitäten für jedes Teil.",
        p1: "Lade ein Foto hoch, und Duffle füllt das Teil für dich aus.",
        p2: "Dein Kleiderschrank begleitet dich auf jede Reise und liefert die Packvorschläge.",
      },
      documents: {
        title: "Dokumente",
        body: "Pässe, Ausweise und Führerscheine bleiben privat in deinem Konto.",
        p1: "Lade ein Foto oder PDF hoch, und Duffle liest Art, Name, Nummer und Daten aus.",
        p2: "Hänge ein Dokument nur an eine Reise an, wenn sie es braucht.",
      },
      notifications: {
        title: "Benachrichtigungen",
        body: "Die Glocke zeigt Reiseänderungen, neue Ausgaben, Einladungen und Flugupdates.",
        p1: "Aktiviere Push-Benachrichtigungen im Panel, um sie auch bei geschlossenem Duffle zu bekommen.",
      },
      profile: {
        title: "Profil",
        body: "Dein Foto, deine Kontaktdaten und dein Heimatland.",
        p1: "Dein Heimatland bestimmt die Zielflaggen deiner Reisen.",
      },
    },
    readingTitle: "Dateien werden für dich gelesen.",
    readingBody: "Wo immer du ein Dokument, eine Police, ein Kleidungsfoto oder eine Excel-Tabelle hochlädst, füllt Duffle das Formular für dich aus. Prüfe es vor dem Speichern.",
    goToTrips: "Zu meinen Reisen",
  },
};

export default guide;
