import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const mail: Translation<Messages["mail"]> = {
  buttonFallback: "Si el botón no funciona, pega este enlace en tu navegador:",
  tagline: "Duffle · Todo el viaje en un solo lugar.",
  notConfigured: "El envío de correos aún no está configurado.",
  sendFailed: "No se pudo enviar el correo. Inténtalo de nuevo.",
  verify: {
    subject: "Confirma tu cuenta de Duffle",
    heading: "Confirma tu correo",
    body: "¡Bienvenido a Duffle! Confirma {email} para terminar de configurar tu cuenta.",
    action: "Confirmar correo",
    note: "Este enlace caduca en 24 horas. Si no creaste una cuenta, puedes ignorar este correo.",
  },
  existing: {
    subject: "Tu cuenta de Duffle",
    heading: "Ya tienes una cuenta",
    google: "La cuenta de {email} usa Google para iniciar sesión. Inicia sesión con Google para volver a tus viajes.",
    password: "Ya existe una cuenta para {email}. Inicia sesión o restablece la contraseña si la olvidaste.",
    signInGoogle: "Iniciar sesión con Google",
    signIn: "Iniciar sesión",
    resetPassword: "Restablecer contraseña",
    note: "Si no lo pediste, puedes ignorar este correo.",
  },
  reset: {
    subject: "Restablece tu contraseña de Duffle",
    heading: "Restablece tu contraseña",
    body: "Recibimos una solicitud para restablecer la contraseña de {email}. Elige una nueva a continuación.",
    action: "Restablecer contraseña",
    note: "Este enlace caduca en una hora. Si no lo pediste, puedes ignorar este correo: tu contraseña no cambiará.",
  },
};

export default mail;
