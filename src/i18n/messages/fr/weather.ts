import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const weather: Translation<Messages["weather"]> = {
  heading: "Prévisions",
  sub: "La météo quotidienne d'Open-Meteo pour les dates de chaque destination.",
  emptyTitle: "Pas encore de prévisions",
  addDestination: "Ajouter une destination",
  emptyBody: "Les prévisions suivent vos destinations. Ajoutez sur la carte les lieux où vous allez, avec leurs dates, et leur météo quotidienne apparaîtra ici.",
  noDays: "Pas encore de prévisions. Utilisez Charger les prévisions ci-dessus environ deux semaines avant le voyage.",
  mm: "{value} mm",
  kmh: "{value} km/h",
  load: "Charger les prévisions",
  loading: "Chargement des prévisions...",
  saved: {
    one: "{count} jour enregistré.",
    other: "{count} jours enregistrés.",
  },
  errors: {
    noDestinations: "Ajoutez une destination avant de charger la météo.",
    tooEarly: "Il est trop tôt pour des prévisions. Revenez environ deux semaines avant le voyage.",
    failed: "Impossible de charger les prévisions pour l'instant. Réessayez un peu plus tard.",
  },
};

export default weather;
