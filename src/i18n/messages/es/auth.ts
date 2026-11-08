import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const auth: Translation<Messages["auth"]> = {
  home: "Inicio de Duffle",
  orEmail: "o continúa con tu correo",
  continueGoogle: "Continuar con Google",
  email: "Correo electrónico",
  password: "Contraseña",
  confirmPassword: "Confirmar contraseña",
  newPassword: "Nueva contraseña",
  name: "Nombre",
  emailPlaceholder: "nombre@ejemplo.com",
  login: {
    title: "Hola de nuevo",
    description: "Inicia sesión para planificar, hacer la maleta y repartir gastos con tu grupo de viaje.",
    noAccount: "¿Aún no tienes cuenta? <link>Crea una</link>",
    submit: "Iniciar sesión",
    forgot: "¿Olvidaste tu contraseña?",
  },
  register: {
    title: "Crea tu cuenta",
    description: "Usa Google o rellena tus datos. Te enviaremos un enlace para confirmar tu correo.",
    haveAccount: "¿Ya tienes cuenta? <link>Inicia sesión</link>",
    submit: "Crear cuenta",
    account: "Cuenta",
    aboutYou: "Sobre ti",
    passwordHint: "Al menos 8 caracteres.",
  },
  forgot: {
    title: "Restablecer contraseña",
    description: "Te enviaremos un enlace si esta dirección usa contraseña.",
    submit: "Enviar enlace",
    backToSignIn: "Volver a iniciar sesión",
  },
  reset: {
    title: "Elige una nueva contraseña",
    description: "También se cerrarán las demás sesiones de la cuenta.",
    submit: "Guardar contraseña",
    missing: "Falta el enlace para restablecer.",
    requestNew: "Pedir un enlace nuevo",
  },
  verify: {
    title: "Confirma tu correo",
    description: "Así comprobamos que la dirección es tuya antes de iniciar sesión o aceptar una invitación.",
    submit: "Confirmar correo",
    missing: "Falta el enlace de confirmación.",
  },
  google: {
    configuration: "El inicio de sesión con Google falló en el servidor. Inténtalo de nuevo o usa correo y contraseña.",
    accessDenied: "Google no confirmó esta dirección de correo.",
    failed: "El inicio de sesión con Google falló. Inténtalo de nuevo.",
  },
  notices: {
    verified: "Correo confirmado. Inicia sesión.",
    password: "Contraseña actualizada. Inicia sesión con la nueva. Se cerraron las demás sesiones.",
    reset: "Contraseña actualizada. Inicia sesión con la nueva.",
    confirm: "Confirma tu correo antes de unirte a un viaje.",
  },
  messages: {
    accountMail: "Revisa tu correo. Si esta dirección puede usarse para una cuenta, te enviamos un enlace.",
    resetSent: "Si ese correo tiene una cuenta con contraseña, te enviamos un enlace.",
  },
  errors: {
    nameShort: "El nombre debe tener al menos 2 caracteres.",
    email: "Escribe un correo válido.",
    passwordShort: "La contraseña debe tener al menos 8 caracteres.",
    passwordMismatch: "Las contraseñas no coinciden.",
    passwordSame: "Elige una contraseña diferente.",
    passwordWrong: "La contraseña actual no es correcta.",
    googleAccount: "Esta cuenta inicia sesión con Google.",
    noMailRegister: "Las cuentas con contraseña necesitan envío de correo. Inicia sesión con Google o configura SMTP.",
    noMailReset: "Restablecer la contraseña necesita envío de correo. Configura SMTP o inicia sesión con Google.",
    invalidLogin: "Correo o contraseña incorrectos.",
    confirmFirst: "Confirma tu correo antes de iniciar sesión. Te enviamos un enlace nuevo.",
    linkInvalid: "Este enlace no es válido o ha caducado.",
    tooMany: "Demasiados intentos. Inténtalo más tarde.",
    deleteFailed: "No se pudo eliminar la cuenta.",
  },
};

export default auth;
