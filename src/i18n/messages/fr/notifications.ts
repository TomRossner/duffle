import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const notifications: Translation<Messages["notifications"]> = {
  someone: "Un voyageur",
  someoneLower: "un voyageur",
  theTrip: "le voyage",
  joined: {
    title: "Nouveau voyageur",
    body: "{name} a rejoint {trip}.",
  },
  invited: {
    title: "Invitation à un voyage",
    body: "Vous êtes invité à {trip}.",
  },
  plannedAdded: {
    title: "Coût prévu ajouté",
    body: "{name} a ajouté {item}.",
  },
  budgetRowAdded: {
    title: "Coût prévu ajouté",
    body: "{name} a ajouté {item} depuis une feuille de budget.",
  },
  budgetImported: {
    title: "Feuille de budget importée",
    body: {
      one: "{name} a importé {count} tableau de budget.",
      other: "{name} a importé {count} tableaux de budget.",
    },
  },
  documentAdded: {
    title: "Document ajouté",
    body: "{name} a ajouté {item}.",
  },
  documentUpdated: {
    title: "Document modifié",
    body: "{name} a modifié {item}.",
  },
  documentRemoved: {
    title: "Document retiré",
    body: "{name} a retiré {item}.",
  },
  expenseAdded: {
    title: "Dépense ajoutée",
    body: "{name} a ajouté {item}.",
  },
  expenseUpdated: {
    title: "Dépense modifiée",
    body: "{name} a modifié {item}.",
  },
  expenseRemoved: {
    title: "Dépense retirée",
    body: "{name} a retiré {item}.",
  },
  expensePaid: {
    title: "Dépense marquée payée",
    body: "{name} a marqué {item} comme payé.",
  },
  expenseUnpaid: {
    title: "Dépense marquée non payée",
    body: "{name} a marqué {item} comme non payé.",
  },
  settlement: {
    title: "Remboursement enregistré",
    body: "{name} a payé {to}.",
  },
  insuranceAdded: {
    title: "Assurance ajoutée",
    body: "{name} a ajouté {item}.",
  },
  insuranceUpdated: {
    title: "Assurance modifiée",
    body: "{name} a modifié {item}.",
  },
  insuranceRemoved: {
    title: "Assurance retirée",
    body: "{name} a retiré {item}.",
  },
  flightAdded: {
    title: "Vol ajouté",
    body: "{name} a ajouté {item}.",
  },
  flightsAdded: {
    title: "Vols ajoutés",
    body: "{name} a ajouté {item}.",
  },
  flightUpdated: {
    title: "Vol modifié",
    body: "{name} a modifié {item}.",
  },
  flightRemoved: {
    title: "Vol retiré",
    body: "{name} a retiré {item}.",
  },
  flightChanged: {
    title: "{item} a changé",
    body: "{route} : {changes}.",
  },
  stayAdded: {
    title: "Hébergement ajouté",
    body: "{name} a ajouté {item}.",
  },
  stayUpdated: {
    title: "Hébergement modifié",
    body: "{name} a modifié {item}.",
  },
  stayRemoved: {
    title: "Hébergement retiré",
    body: "{name} a retiré {item}.",
  },
  planAdded: {
    title: "Programme mis à jour",
    body: {
      one: "{name} a ajouté {item}.",
      other: "{name} a ajouté {item} sur {count} jours.",
    },
  },
  planUpdated: {
    title: "Programme mis à jour",
    body: {
      one: "{name} a modifié {item}.",
      other: "{name} a modifié {item} sur {count} jours.",
    },
  },
  planRemoved: {
    title: "Programme mis à jour",
    body: "{name} a retiré {item}.",
  },
  bell: {
    label: "Notifications",
    labelUnread: "Notifications, {count} non lues",
    fresh: "{count} nouvelles",
    close: "Fermer les notifications",
    caughtUp: "Vous êtes à jour",
    caughtUpHint: "Les invitations, changements et rappels apparaîtront ici.",
    new: "Nouvelles",
    earlier: "Plus tôt",
    pushReady: "Les alertes sont activées sur cet appareil.",
    pushDenied: "Les notifications sont bloquées dans les réglages du navigateur.",
    pushUnsupported: "Ce navigateur ne peut pas afficher d'alertes.",
    pushOffer: "Recevez des alertes sur cet appareil, même quand Duffle est fermé.",
    turnOn: "Activer",
    justNow: "à l'instant",
  },
};

export default notifications;
