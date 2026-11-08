import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const ui: Translation<Messages["ui"]> = {
  openEmailLink: "Abrir el enlace del correo",
  smtpNote: " (se muestra porque SMTP no está configurado)",
  inviteLinkHint: "Comparte este enlace con el viajero. Corresponde al correo que escribiste.",
  confirmTitle: "¿Seguro?",
  confirmGeneric: "¿Seguro que quieres hacerlo?",
  costOptional: "Coste (opcional)",
  currency: "Moneda",
  rateOptional: "Tipo de cambio (opcional)",
  rateNotNeeded: "No hace falta",
  ratePlaceholder: "1 {currency} = ? {base}",
  rateSame: "Los importes en {base} no necesitan conversión.",
  rateHint: "Cuántos {base} vale un {currency}. Déjalo vacío para usar el cambio de ese día.",
  tripCurrency: "Moneda del viaje",
};

export default ui;
