import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const map: Translation<Messages["map"]> = {
  page: {
    heading: "Destinations",
    sub: "Chaque étape est un lieu et les jours où vous y êtes.",
    addTitle: "Ajouter une destination",
    addDescription: "Cherchez une ville ou un lieu, puis indiquez les jours où vous y serez.",
    emptyTitle: "Aucune destination pour l'instant",
    emptyBody: "Ajoutez chaque ville ou étape du voyage avec ses dates. Elles sont épinglées sur la carte, ont une prévision météo et regroupent les activités prévues sur place. Commencez avec Ajouter une destination, ci-dessus.",
    activities: "Activités",
    nothingHere: "Rien de prévu à cette étape pour l'instant.",
  },
  form: {
    place: "Lieu",
    name: "Nom",
    rename: "Renommer",
    clear: "Effacer",
    address: "Adresse",
    latitude: "Latitude",
    longitude: "Longitude",
    usePlace: "Utiliser {name}",
    searchHint: "Cherchez, puis choisissez un résultat. Cela place l'épingle.",
    enterYourself: "Saisir un lieu vous-même",
    firstDay: "Premier jour",
    lastDay: "Dernier jour",
    note: "Note",
    optional: "Facultatif",
    addDestination: "Ajouter la destination",
  },
  card: {
    confirmRemove: "Voulez-vous vraiment retirer {name} et ses activités ?",
    editTitle: "Modifier {name}",
  },
  search: {
    placeholder: "Chercher une ville ou un lieu",
    searching: "Recherche",
    search: "Chercher",
  },
  view: {
    noKey: "Ajoutez GOOGLE_MAPS_API_KEY pour afficher Google Maps. Les destinations ajoutées restent listées.",
    addOne: "Ajoutez une destination pour la voir sur la carte.",
    sketchNoKey: "Ce croquis utilise les coordonnées enregistrées. Google Maps se charge quand GOOGLE_MAPS_API_KEY est définie.",
    sketchFailed: "Google Maps ne s'est pas chargé avec cette clé. Les destinations restent visibles sur ce croquis.",
  },
  errors: {
    signIn: "Connectez-vous pour chercher des lieux.",
    nameDestination: "Donnez un nom à la destination.",
    choosePlace: "Choisissez un lieu dans la recherche, ou saisissez sa position.",
    chooseDates: "Choisissez les dates où vous y serez.",
    lastAfterFirst: "Le dernier jour doit être le même que le premier ou après.",
    insideTrip: "Les dates de la destination doivent être comprises dans le voyage.",
    destinationNotFound: "Destination introuvable.",
    nameActivity: "Donnez un nom à l'activité.",
    activityNotFound: "Activité introuvable.",
    noKey: "Ajoutez GOOGLE_MAPS_API_KEY pour chercher des lieux. Vous pouvez quand même saisir un nom et des coordonnées.",
    searchFailed: "La recherche a échoué. Vérifiez la clé Google Maps et les API activées.",
  },
};

export default map;
