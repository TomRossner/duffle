import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const closet: Translation<Messages["closet"]> = {
  title: "Garde-robe",
  subtitle: "Vous seul voyez ces articles. Les voyages s'en servent pour suggérer quoi emporter.",
  board: {
    search: "Rechercher",
    searchPlaceholder: "Nom ou description",
    type: "Type",
    allTypes: "Tous les types",
    empty: "Aucun article pour l'instant.",
    noMatch: "Aucun article ne correspond.",
    outerwear: "Vêtements d'extérieur",
    accessories: "Accessoires",
  },
  fields: {
    name: "Nom",
    type: "Type",
    quantity: "Quantité",
    coolest: "Minimum °C",
    warmest: "Maximum °C",
    description: "Description",
    weather: "Météo",
    activities: "Activités",
    features: "Caractéristiques",
  },
  card: {
    noTags: "Aucune étiquette",
    editTitle: "Modifier {name}",
    editDescription: "Changez le type, la météo ou les activités.",
    confirmDelete: "Voulez-vous vraiment supprimer « {name} » ?",
  },
  add: {
    button: "Ajouter un article",
    description: "Déposez une photo et les informations sont remplies pour vous. Vérifiez-les, puis enregistrez.",
    submit: "Ajouter à la garde-robe",
  },
  image: {
    photo: "Photo",
    badType: "Utilisez un JPEG, PNG, WebP ou GIF.",
    tooBig: "Cette image dépasse 5 Mo. Choisissez un fichier plus petit.",
    filled: "Informations remplies à partir de la photo. Vérifiez-les avant d'enregistrer.",
    kept: "Les informations saisies ont été conservées.",
    fileMeta: "Image · {size} · Cliquez ou déposez pour remplacer",
    prompt: "<em>Importez une image</em> ou déposez-la ici",
    formats: "JPEG, PNG, WebP ou GIF, jusqu'à 5 Mo.",
    autoFill: "Les informations sont remplies pour vous.",
    reading: "Analyse de la photo…",
    pasteUrl: "Ou collez l'URL d'une image",
    keepCurrent: "Laissez les deux champs d'image vides pour garder la photo actuelle.",
  },
  errors: {
    name: "Nommez l'article.",
    slot: "Choisissez le type de vêtement.",
    quantity: "La quantité doit être un nombre entier de 1 à 99.",
    imageUrl: "L'URL de l'image doit commencer par http:// ou https://.",
    tempNumbers: "La plage de températures doit être numérique.",
    tempOrder: "Le maximum doit être au moins égal au minimum.",
    chooseImage: "Choisissez une image.",
    notClothing: "Cela ne ressemble pas à un vêtement. Remplissez les informations vous-même.",
    readFailed: "Impossible de lire la photo. Remplissez les informations vous-même.",
    notFound: "Article introuvable.",
  },
};

export default closet;
