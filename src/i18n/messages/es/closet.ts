import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const closet: Translation<Messages["closet"]> = {
  title: "Armario",
  subtitle: "Solo tú ves estas prendas. Los viajes las usan para sugerir qué llevar.",
  board: {
    search: "Buscar",
    searchPlaceholder: "Nombre o descripción",
    type: "Tipo",
    allTypes: "Todos los tipos",
    empty: "Aún no hay prendas.",
    noMatch: "Ninguna prenda coincide.",
    outerwear: "Ropa de abrigo",
    accessories: "Accesorios",
  },
  fields: {
    name: "Nombre",
    type: "Tipo",
    quantity: "Cantidad",
    coolest: "Mínima °C",
    warmest: "Máxima °C",
    description: "Descripción",
    weather: "Tiempo",
    activities: "Actividades",
    features: "Características",
  },
  card: {
    noTags: "Sin etiquetas",
    editTitle: "Editar {name}",
    editDescription: "Cambia el tipo, el tiempo o las actividades.",
    confirmDelete: "¿Seguro que quieres eliminar «{name}»?",
  },
  add: {
    button: "Añadir una prenda",
    description: "Añade una foto y los datos se rellenan solos. Revísalos y guarda.",
    submit: "Añadir al armario",
  },
  image: {
    photo: "Foto",
    badType: "Usa un JPEG, PNG, WebP o GIF.",
    tooBig: "La imagen supera los 5 MB. Elige un archivo más pequeño.",
    filled: "Datos rellenados a partir de la foto. Revísalos antes de guardar.",
    kept: "Se mantuvieron los datos que escribiste.",
    fileMeta: "Imagen · {size} · Haz clic o suelta para reemplazar",
    prompt: "<em>Sube una imagen</em> o suéltala aquí",
    formats: "JPEG, PNG, WebP o GIF, hasta 5 MB.",
    autoFill: "Los datos se rellenan solos.",
    reading: "Mirando la foto…",
    pasteUrl: "O pega la URL de una imagen",
    keepCurrent: "Deja ambos campos de imagen vacíos para conservar la foto actual.",
  },
  errors: {
    name: "Ponle nombre a la prenda.",
    slot: "Elige qué tipo de prenda es.",
    quantity: "La cantidad debe ser un número entero de 1 a 99.",
    imageUrl: "La URL de la imagen debe empezar por http:// o https://.",
    tempNumbers: "El rango de temperatura debe ser numérico.",
    tempOrder: "La máxima debe ser igual o mayor que la mínima.",
    chooseImage: "Elige una imagen.",
    notClothing: "Esto no parece ropa. Rellena los datos tú mismo.",
    readFailed: "No se pudo leer la foto. Rellena los datos tú mismo.",
    notFound: "No se encontró la prenda.",
  },
};

export default closet;
