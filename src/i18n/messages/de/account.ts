import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const account: Translation<Messages["account"]> = {
  actions: "Kontoaktionen",
  changePassword: "Passwort ändern",
  changePasswordHint: "Gib dein aktuelles Passwort ein und wähle dann ein neues.",
  updatePassword: "Passwort aktualisieren",
  currentPassword: "Aktuelles Passwort",
  newPassword: "Neues Passwort",
  confirmNewPassword: "Neues Passwort bestätigen",
  deleteAccount: "Konto löschen",
  deleteMessage: "Dein Profil, dein Kleiderschrank und deine persönlichen Dokumente werden gelöscht. Reisen mit weiteren Reisenden bleiben bestehen, mit einer anderen Person als Admin. Geteilte Ausgaben behalten eine:n „Gelöschte:n Reisende:n“, damit die Salden stimmen.",
  languageHint: "Die Sprache, in der Duffle mit dir spricht, auch in E-Mails und Benachrichtigungen.",
  languageSaved: "Sprache aktualisiert",
};

export default account;
