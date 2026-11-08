import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const ui: Translation<Messages["ui"]> = {
  openEmailLink: "Ouvrir le lien de l'e-mail",
  smtpNote: " (affiché car SMTP n'est pas configuré)",
  inviteLinkHint: "Partagez ce lien avec le voyageur. Il correspond à l'e-mail saisi.",
  confirmTitle: "Vous êtes sûr ?",
  confirmGeneric: "Voulez-vous vraiment faire cela ?",
  costOptional: "Coût (facultatif)",
  currency: "Devise",
  rateOptional: "Taux de change (facultatif)",
  rateNotNeeded: "Inutile",
  ratePlaceholder: "1 {currency} = ? {base}",
  rateSame: "Les montants en {base} n'ont pas besoin de conversion.",
  rateHint: "Combien de {base} vaut un {currency}. Laissez vide pour utiliser le taux du jour.",
  tripCurrency: "Devise du voyage",
};

export default ui;
