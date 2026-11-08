import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const notifications: Translation<Messages["notifications"]> = {
  someone: "Ein:e Reisende:r",
  someoneLower: "eine:n Reisende:n",
  theTrip: "die Reise",
  joined: {
    title: "Neue:r Reisende:r",
    body: "{name} ist {trip} beigetreten.",
  },
  invited: {
    title: "Einladung zu einer Reise",
    body: "Du bist zu {trip} eingeladen.",
  },
  plannedAdded: {
    title: "Geplante Kosten hinzugefügt",
    body: "{name} hat {item} hinzugefügt.",
  },
  budgetRowAdded: {
    title: "Geplante Kosten hinzugefügt",
    body: "{name} hat {item} aus einer Budgettabelle hinzugefügt.",
  },
  budgetImported: {
    title: "Budgettabelle importiert",
    body: {
      one: "{name} hat {count} Budgettabelle importiert.",
      other: "{name} hat {count} Budgettabellen importiert.",
    },
  },
  documentAdded: {
    title: "Dokument hinzugefügt",
    body: "{name} hat {item} hinzugefügt.",
  },
  documentUpdated: {
    title: "Dokument aktualisiert",
    body: "{name} hat {item} aktualisiert.",
  },
  documentRemoved: {
    title: "Dokument entfernt",
    body: "{name} hat {item} entfernt.",
  },
  expenseAdded: {
    title: "Ausgabe hinzugefügt",
    body: "{name} hat {item} hinzugefügt.",
  },
  expenseUpdated: {
    title: "Ausgabe aktualisiert",
    body: "{name} hat {item} aktualisiert.",
  },
  expenseRemoved: {
    title: "Ausgabe entfernt",
    body: "{name} hat {item} entfernt.",
  },
  expensePaid: {
    title: "Ausgabe als bezahlt markiert",
    body: "{name} hat {item} als bezahlt markiert.",
  },
  expenseUnpaid: {
    title: "Ausgabe als unbezahlt markiert",
    body: "{name} hat {item} als unbezahlt markiert.",
  },
  settlement: {
    title: "Zahlung erfasst",
    body: "{name} hat {to} bezahlt.",
  },
  insuranceAdded: {
    title: "Versicherung hinzugefügt",
    body: "{name} hat {item} hinzugefügt.",
  },
  insuranceUpdated: {
    title: "Versicherung aktualisiert",
    body: "{name} hat {item} aktualisiert.",
  },
  insuranceRemoved: {
    title: "Versicherung entfernt",
    body: "{name} hat {item} entfernt.",
  },
  flightAdded: {
    title: "Flug hinzugefügt",
    body: "{name} hat {item} hinzugefügt.",
  },
  flightsAdded: {
    title: "Flüge hinzugefügt",
    body: "{name} hat {item} hinzugefügt.",
  },
  flightUpdated: {
    title: "Flug aktualisiert",
    body: "{name} hat {item} aktualisiert.",
  },
  flightRemoved: {
    title: "Flug entfernt",
    body: "{name} hat {item} entfernt.",
  },
  flightChanged: {
    title: "{item} hat sich geändert",
    body: "{route}: {changes}.",
  },
  stayAdded: {
    title: "Unterkunft hinzugefügt",
    body: "{name} hat {item} hinzugefügt.",
  },
  stayUpdated: {
    title: "Unterkunft aktualisiert",
    body: "{name} hat {item} aktualisiert.",
  },
  stayRemoved: {
    title: "Unterkunft entfernt",
    body: "{name} hat {item} entfernt.",
  },
  planAdded: {
    title: "Zeitplan aktualisiert",
    body: {
      one: "{name} hat {item} hinzugefügt.",
      other: "{name} hat {item} an {count} Tagen hinzugefügt.",
    },
  },
  planUpdated: {
    title: "Zeitplan aktualisiert",
    body: {
      one: "{name} hat {item} aktualisiert.",
      other: "{name} hat {item} an {count} Tagen aktualisiert.",
    },
  },
  planRemoved: {
    title: "Zeitplan aktualisiert",
    body: "{name} hat {item} entfernt.",
  },
  bell: {
    label: "Benachrichtigungen",
    labelUnread: "Benachrichtigungen, {count} ungelesen",
    fresh: "{count} neu",
    close: "Benachrichtigungen schließen",
    caughtUp: "Du bist auf dem neuesten Stand",
    caughtUpHint: "Einladungen, Änderungen und Erinnerungen erscheinen hier.",
    new: "Neu",
    earlier: "Früher",
    pushReady: "Benachrichtigungen sind auf diesem Gerät an.",
    pushDenied: "Benachrichtigungen sind in den Browsereinstellungen blockiert.",
    pushUnsupported: "Dieser Browser kann keine Benachrichtigungen anzeigen.",
    pushOffer: "Erhalte Benachrichtigungen auf diesem Gerät, auch wenn Duffle geschlossen ist.",
    turnOn: "Einschalten",
    justNow: "gerade eben",
  },
};

export default notifications;
