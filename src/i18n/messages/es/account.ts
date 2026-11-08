import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const account: Translation<Messages["account"]> = {
  actions: "Acciones de la cuenta",
  changePassword: "Cambiar contraseña",
  changePasswordHint: "Usa tu contraseña actual y luego elige una nueva.",
  updatePassword: "Actualizar contraseña",
  currentPassword: "Contraseña actual",
  newPassword: "Nueva contraseña",
  confirmNewPassword: "Confirmar nueva contraseña",
  deleteAccount: "Eliminar cuenta",
  deleteMessage: "Se eliminan tu perfil, tu armario y tus documentos personales. Los viajes con otros viajeros se mantienen, a cargo de otro administrador. Los gastos compartidos conservan un «Viajero eliminado» para que los saldos sigan cuadrando.",
  languageHint: "El idioma que Duffle usa contigo, también en correos y notificaciones.",
  languageSaved: "Idioma actualizado",
};

export default account;
