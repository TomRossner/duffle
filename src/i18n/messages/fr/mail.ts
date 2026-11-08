import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const mail: Translation<Messages["mail"]> = {
  buttonFallback: "Si le bouton ne fonctionne pas, collez ce lien dans votre navigateur :",
  tagline: "Duffle · Tout le voyage au même endroit.",
  notConfigured: "L'envoi d'e-mails n'est pas encore configuré.",
  sendFailed: "Impossible d'envoyer l'e-mail. Réessayez.",
  verify: {
    subject: "Confirmez votre compte Duffle",
    heading: "Confirmez votre e-mail",
    body: "Bienvenue sur Duffle ! Confirmez {email} pour finaliser votre compte.",
    action: "Confirmer l'e-mail",
    note: "Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet e-mail.",
  },
  existing: {
    subject: "Votre compte Duffle",
    heading: "Vous avez déjà un compte",
    google: "Le compte de {email} se connecte avec Google. Connectez-vous avec Google pour retrouver vos voyages.",
    password: "Un compte existe déjà pour {email}. Connectez-vous, ou réinitialisez le mot de passe si vous l'avez oublié.",
    signInGoogle: "Se connecter avec Google",
    signIn: "Se connecter",
    resetPassword: "Réinitialiser le mot de passe",
    note: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
  },
  reset: {
    subject: "Réinitialisez votre mot de passe Duffle",
    heading: "Réinitialiser votre mot de passe",
    body: "Nous avons reçu une demande de réinitialisation du mot de passe pour {email}. Choisissez-en un nouveau ci-dessous.",
    action: "Réinitialiser le mot de passe",
    note: "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe ne changera pas.",
  },
};

export default mail;
