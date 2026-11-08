import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const auth: Translation<Messages["auth"]> = {
  home: "Accueil Duffle",
  orEmail: "ou continuer avec un e-mail",
  continueGoogle: "Continuer avec Google",
  email: "E-mail",
  password: "Mot de passe",
  confirmPassword: "Confirmer le mot de passe",
  newPassword: "Nouveau mot de passe",
  name: "Nom",
  emailPlaceholder: "nom@exemple.com",
  login: {
    title: "Bon retour",
    description: "Connectez-vous pour organiser, préparer vos bagages et partager les frais avec votre groupe.",
    noAccount: "Pas encore de compte ? <link>Créez-en un</link>",
    submit: "Se connecter",
    forgot: "Mot de passe oublié ?",
  },
  register: {
    title: "Créer votre compte",
    description: "Utilisez Google ou remplissez vos informations. Nous vous enverrons un lien pour confirmer votre adresse.",
    haveAccount: "Vous avez déjà un compte ? <link>Se connecter</link>",
    submit: "Créer le compte",
    account: "Compte",
    aboutYou: "À propos de vous",
    passwordHint: "Au moins 8 caractères.",
  },
  forgot: {
    title: "Réinitialiser le mot de passe",
    description: "Nous enverrons un lien si cette adresse utilise un mot de passe.",
    submit: "Envoyer le lien",
    backToSignIn: "Retour à la connexion",
  },
  reset: {
    title: "Choisir un nouveau mot de passe",
    description: "Cela déconnecte aussi les autres sessions du compte.",
    submit: "Enregistrer le mot de passe",
    missing: "Le lien de réinitialisation est manquant.",
    requestNew: "Demander un nouveau lien",
  },
  verify: {
    title: "Confirmez votre e-mail",
    description: "Cela prouve que l'adresse vous appartient avant de vous connecter ou d'accepter une invitation.",
    submit: "Confirmer l'e-mail",
    missing: "Le lien de confirmation est manquant.",
  },
  google: {
    configuration: "La connexion Google a échoué côté serveur. Réessayez, ou utilisez e-mail et mot de passe.",
    accessDenied: "Google n'a pas confirmé cette adresse e-mail.",
    failed: "La connexion Google a échoué. Réessayez.",
  },
  notices: {
    verified: "E-mail confirmé. Connectez-vous.",
    password: "Mot de passe mis à jour. Connectez-vous avec le nouveau. Les autres sessions ont été déconnectées.",
    reset: "Mot de passe mis à jour. Connectez-vous avec le nouveau.",
    confirm: "Confirmez votre e-mail avant de rejoindre un voyage.",
  },
  messages: {
    accountMail: "Consultez vos e-mails. Si cette adresse peut servir pour un compte, nous avons envoyé un lien.",
    resetSent: "Si cet e-mail a un compte avec mot de passe, nous avons envoyé un lien.",
  },
  errors: {
    nameShort: "Le nom doit faire au moins 2 caractères.",
    email: "Saisissez un e-mail valide.",
    passwordShort: "Le mot de passe doit faire au moins 8 caractères.",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    passwordSame: "Choisissez un autre mot de passe.",
    passwordWrong: "Le mot de passe actuel est incorrect.",
    googleAccount: "Ce compte se connecte avec Google.",
    noMailRegister: "Les comptes avec mot de passe nécessitent l'envoi d'e-mails. Connectez-vous avec Google ou configurez SMTP.",
    noMailReset: "La réinitialisation nécessite l'envoi d'e-mails. Configurez SMTP ou connectez-vous avec Google.",
    invalidLogin: "E-mail ou mot de passe incorrect.",
    confirmFirst: "Confirmez votre e-mail avant de vous connecter. Nous avons envoyé un nouveau lien.",
    linkInvalid: "Ce lien n'est pas valide ou a expiré.",
    tooMany: "Trop de tentatives. Réessayez plus tard.",
    deleteFailed: "Impossible de supprimer le compte.",
  },
};

export default auth;
