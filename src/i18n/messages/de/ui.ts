import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const ui: Translation<Messages["ui"]> = {
  openEmailLink: "Link aus der E-Mail öffnen",
  smtpNote: " (angezeigt, weil SMTP nicht eingerichtet ist)",
  inviteLinkHint: "Teile diesen Link mit der Person. Er passt zur eingegebenen E-Mail.",
  confirmTitle: "Bist du sicher?",
  confirmGeneric: "Wirklich fortfahren?",
  costOptional: "Kosten (optional)",
  currency: "Währung",
  rateOptional: "Wechselkurs (optional)",
  rateNotNeeded: "Nicht nötig",
  ratePlaceholder: "1 {currency} = ? {base}",
  rateSame: "Beträge in {base} brauchen keine Umrechnung.",
  rateHint: "Wie viele {base} ein {currency} wert ist. Leer lassen, um den Tageskurs zu verwenden.",
  tripCurrency: "Reisewährung",
};

export default ui;
