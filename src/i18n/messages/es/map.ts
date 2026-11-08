import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const map: Translation<Messages["map"]> = {
  page: {
    heading: "Destinos",
    sub: "Cada parada es un lugar y los días que estás allí.",
    addTitle: "Añadir un destino",
    addDescription: "Busca una ciudad o un lugar y elige los días que estarás allí.",
    emptyTitle: "Aún no hay destinos",
    emptyBody: "Añade cada ciudad o parada del viaje con sus fechas. Aparecen en el mapa, tienen previsión del tiempo y guardan las actividades que planees allí. Empieza con Añadir un destino, arriba.",
    activities: "Actividades",
    nothingHere: "Aún no hay nada planeado en esta parada.",
  },
  form: {
    place: "Lugar",
    name: "Nombre",
    rename: "Cambiar nombre",
    clear: "Quitar",
    address: "Dirección",
    latitude: "Latitud",
    longitude: "Longitud",
    usePlace: "Usar {name}",
    searchHint: "Busca y elige un resultado. Así se coloca el pin.",
    enterYourself: "Introducir la ubicación a mano",
    firstDay: "Primer día",
    lastDay: "Último día",
    note: "Nota",
    optional: "Opcional",
    addDestination: "Añadir destino",
  },
  card: {
    confirmRemove: "¿Seguro que quieres quitar {name} y sus actividades?",
    editTitle: "Editar {name}",
  },
  search: {
    placeholder: "Busca una ciudad o un lugar",
    searching: "Buscando",
    search: "Buscar",
  },
  view: {
    noKey: "Añade GOOGLE_MAPS_API_KEY para mostrar Google Maps. Los destinos que añadas seguirán en la lista.",
    addOne: "Añade un destino para verlo en el mapa.",
    sketchNoKey: "Este esquema usa las coordenadas guardadas. Google Maps se carga cuando GOOGLE_MAPS_API_KEY está configurada.",
    sketchFailed: "Google Maps no se cargó con esta clave. Los destinos siguen en este esquema de coordenadas.",
  },
  errors: {
    signIn: "Inicia sesión para buscar lugares.",
    nameDestination: "Ponle nombre al destino.",
    choosePlace: "Elige un lugar de la búsqueda o introduce su ubicación.",
    chooseDates: "Elige las fechas en que estarás allí.",
    lastAfterFirst: "El último día debe ser igual o posterior al primero.",
    insideTrip: "Las fechas del destino deben estar dentro del viaje.",
    destinationNotFound: "No se encontró el destino.",
    nameActivity: "Ponle nombre a la actividad.",
    activityNotFound: "No se encontró la actividad.",
    noKey: "Añade GOOGLE_MAPS_API_KEY para buscar lugares. Puedes introducir un nombre y coordenadas igualmente.",
    searchFailed: "La búsqueda falló. Revisa la clave de Google Maps y las API activadas.",
  },
};

export default map;
