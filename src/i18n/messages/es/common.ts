import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const common: Translation<Messages["common"]> = {
  save: "Guardar",
  saving: "Guardando...",
  cancel: "Cancelar",
  close: "Cerrar",
  remove: "Quitar",
  removing: "Quitando...",
  edit: "Editar",
  delete: "Eliminar",
  deleting: "Eliminando...",
  back: "Atrás",
  tryAgain: "Reintentar",
  goHome: "Ir al inicio",
  gotIt: "Entendido",
  notAdded: "No añadido",
  copy: "Copiar",
  copied: "Copiado",
  actionsFor: "Acciones de {name}",
  confirmRemove: "¿Seguro que quieres quitar {name}?",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  signIn: "Iniciar sesión",
  signUp: "Registrarse",
  signOut: "Cerrar sesión",
  logOut: "Cerrar sesión",
  you: "Tú",
  language: "Idioma",
  or: "o",
  and: "y",
  days: {
    one: "{count} día",
    other: "{count} días",
  },
  nights: {
    one: "{count} noche",
    other: "{count} noches",
  },
  travelers: {
    one: "{count} viajero",
    other: "{count} viajeros",
  },
  cookies: {
    label: "Aviso de cookies",
    text: "Este sitio usa cookies para mantener tu sesión iniciada y recordar tus preferencias.",
  },
  notFound: {
    title: "Página no encontrada",
    heading: "Esta página no está en el mapa.",
    body: "Puede que el enlace esté desactualizado o que la página se haya eliminado.",
  },
  error: {
    heading: "Algo salió mal.",
    body: "No se pudo cargar la página. Inténtalo de nuevo.",
    generic: "Algo salió mal. Inténtalo de nuevo.",
  },
};

export default common;
