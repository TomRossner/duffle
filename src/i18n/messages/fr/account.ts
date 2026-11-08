import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const account: Translation<Messages["account"]> = {
  actions: "Actions du compte",
  changePassword: "Changer le mot de passe",
  changePasswordHint: "Saisissez votre mot de passe actuel, puis choisissez-en un nouveau.",
  updatePassword: "Mettre à jour",
  currentPassword: "Mot de passe actuel",
  newPassword: "Nouveau mot de passe",
  confirmNewPassword: "Confirmer le nouveau mot de passe",
  deleteAccount: "Supprimer le compte",
  deleteMessage: "Votre profil, votre garde-robe et vos documents personnels sont supprimés. Les voyages qui comptent d'autres voyageurs sont conservés, confiés à un autre administrateur. Les dépenses partagées gardent un « Voyageur supprimé » pour que les soldes restent justes.",
  languageHint: "La langue utilisée par Duffle avec vous, y compris dans les e-mails et notifications.",
  languageSaved: "Langue mise à jour",
};

export default account;
