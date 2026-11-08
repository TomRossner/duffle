import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const common: Translation<Messages["common"]> = {
  save: "Enregistrer",
  saving: "Enregistrement...",
  cancel: "Annuler",
  close: "Fermer",
  remove: "Retirer",
  removing: "Suppression...",
  edit: "Modifier",
  delete: "Supprimer",
  deleting: "Suppression...",
  back: "Retour",
  tryAgain: "Réessayer",
  goHome: "Accueil",
  gotIt: "Compris",
  notAdded: "Non renseigné",
  copy: "Copier",
  copied: "Copié",
  actionsFor: "Actions pour {name}",
  confirmRemove: "Voulez-vous vraiment retirer {name} ?",
  openMenu: "Ouvrir le menu",
  closeMenu: "Fermer le menu",
  signIn: "Se connecter",
  signUp: "S'inscrire",
  signOut: "Se déconnecter",
  logOut: "Se déconnecter",
  you: "Vous",
  language: "Langue",
  or: "ou",
  and: "et",
  days: {
    one: "{count} jour",
    other: "{count} jours",
  },
  nights: {
    one: "{count} nuit",
    other: "{count} nuits",
  },
  travelers: {
    one: "{count} voyageur",
    other: "{count} voyageurs",
  },
  cookies: {
    label: "Avis sur les cookies",
    text: "Ce site utilise des cookies pour vous garder connecté et retenir vos préférences.",
  },
  notFound: {
    title: "Page introuvable",
    heading: "Cette page n'est pas sur la carte.",
    body: "Le lien est peut-être obsolète, ou la page a été supprimée.",
  },
  error: {
    heading: "Un problème est survenu.",
    body: "La page n'a pas pu être chargée. Réessayez.",
    generic: "Un problème est survenu. Réessayez.",
  },
};

export default common;
