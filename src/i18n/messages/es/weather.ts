import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const weather: Translation<Messages["weather"]> = {
  heading: "Previsión",
  sub: "El tiempo diario de Open-Meteo para las fechas de cada destino.",
  emptyTitle: "Aún no hay previsión",
  addDestination: "Añadir un destino",
  emptyBody: "La previsión sigue a tus destinos. Añade en el mapa los lugares a los que vas, con sus fechas, y aquí aparecerá su tiempo diario.",
  noDays: "Aún no hay previsión. Usa Cargar previsión, arriba, cuando falten unas dos semanas para el viaje.",
  mm: "{value} mm",
  kmh: "{value} km/h",
  load: "Cargar previsión",
  loading: "Cargando previsión...",
  saved: {
    one: "Se guardó {count} día.",
    other: "Se guardaron {count} días.",
  },
  errors: {
    noDestinations: "Añade un destino antes de cargar el tiempo.",
    tooEarly: "Aún es pronto para la previsión. Vuelve unas dos semanas antes del viaje.",
    failed: "No se pudo cargar la previsión ahora. Inténtalo de nuevo en un rato.",
  },
};

export default weather;
