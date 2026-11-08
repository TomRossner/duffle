import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const notifications: Translation<Messages["notifications"]> = {
  someone: "Un viajero",
  someoneLower: "un viajero",
  theTrip: "el viaje",
  joined: {
    title: "Nuevo viajero",
    body: "{name} se unió a {trip}.",
  },
  invited: {
    title: "Invitación a un viaje",
    body: "Te invitaron a {trip}.",
  },
  plannedAdded: {
    title: "Coste previsto añadido",
    body: "{name} añadió {item}.",
  },
  budgetRowAdded: {
    title: "Coste previsto añadido",
    body: "{name} añadió {item} desde una hoja de presupuesto.",
  },
  budgetImported: {
    title: "Hoja de presupuesto importada",
    body: {
      one: "{name} importó {count} tabla de presupuesto.",
      other: "{name} importó {count} tablas de presupuesto.",
    },
  },
  documentAdded: {
    title: "Documento añadido",
    body: "{name} añadió {item}.",
  },
  documentUpdated: {
    title: "Documento actualizado",
    body: "{name} actualizó {item}.",
  },
  documentRemoved: {
    title: "Documento quitado",
    body: "{name} quitó {item}.",
  },
  expenseAdded: {
    title: "Gasto añadido",
    body: "{name} añadió {item}.",
  },
  expenseUpdated: {
    title: "Gasto actualizado",
    body: "{name} actualizó {item}.",
  },
  expenseRemoved: {
    title: "Gasto quitado",
    body: "{name} quitó {item}.",
  },
  expensePaid: {
    title: "Gasto marcado como pagado",
    body: "{name} marcó {item} como pagado.",
  },
  expenseUnpaid: {
    title: "Gasto marcado como no pagado",
    body: "{name} marcó {item} como no pagado.",
  },
  settlement: {
    title: "Pago registrado",
    body: "{name} pagó a {to}.",
  },
  insuranceAdded: {
    title: "Seguro añadido",
    body: "{name} añadió {item}.",
  },
  insuranceUpdated: {
    title: "Seguro actualizado",
    body: "{name} actualizó {item}.",
  },
  insuranceRemoved: {
    title: "Seguro quitado",
    body: "{name} quitó {item}.",
  },
  flightAdded: {
    title: "Vuelo añadido",
    body: "{name} añadió {item}.",
  },
  flightsAdded: {
    title: "Vuelos añadidos",
    body: "{name} añadió {item}.",
  },
  flightUpdated: {
    title: "Vuelo actualizado",
    body: "{name} actualizó {item}.",
  },
  flightRemoved: {
    title: "Vuelo quitado",
    body: "{name} quitó {item}.",
  },
  flightChanged: {
    title: "Cambios en {item}",
    body: "{route}: {changes}.",
  },
  stayAdded: {
    title: "Alojamiento añadido",
    body: "{name} añadió {item}.",
  },
  stayUpdated: {
    title: "Alojamiento actualizado",
    body: "{name} actualizó {item}.",
  },
  stayRemoved: {
    title: "Alojamiento quitado",
    body: "{name} quitó {item}.",
  },
  planAdded: {
    title: "Agenda actualizada",
    body: {
      one: "{name} añadió {item}.",
      other: "{name} añadió {item} en {count} días.",
    },
  },
  planUpdated: {
    title: "Agenda actualizada",
    body: {
      one: "{name} actualizó {item}.",
      other: "{name} actualizó {item} en {count} días.",
    },
  },
  planRemoved: {
    title: "Agenda actualizada",
    body: "{name} quitó {item}.",
  },
  bell: {
    label: "Notificaciones",
    labelUnread: "Notificaciones, {count} sin leer",
    fresh: "{count} nuevas",
    close: "Cerrar notificaciones",
    caughtUp: "Estás al día",
    caughtUpHint: "Aquí aparecerán invitaciones, cambios y recordatorios.",
    new: "Nuevas",
    earlier: "Anteriores",
    pushReady: "Las alertas están activadas en este dispositivo.",
    pushDenied: "Las notificaciones están bloqueadas en la configuración del navegador.",
    pushUnsupported: "Este navegador no puede mostrar alertas.",
    pushOffer: "Recibe alertas en este dispositivo, incluso con Duffle cerrado.",
    turnOn: "Activar",
    justNow: "ahora",
  },
};

export default notifications;
