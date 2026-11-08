import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const ui: Translation<Messages["ui"]> = {
  openEmailLink: "Открыть ссылку из письма",
  smtpNote: " (показано, потому что SMTP не настроен)",
  inviteLinkHint: "Отправьте эту ссылку участнику. Она привязана к указанной почте.",
  confirmTitle: "Вы уверены?",
  confirmGeneric: "Выполнить это действие?",
  costOptional: "Стоимость (необязательно)",
  currency: "Валюта",
  rateOptional: "Курс (необязательно)",
  rateNotNeeded: "Не нужен",
  ratePlaceholder: "1 {currency} = ? {base}",
  rateSame: "Суммы в {base} не нужно пересчитывать.",
  rateHint: "Сколько {base} стоит один {currency}. Оставьте пустым, чтобы взять курс того дня.",
  tripCurrency: "Валюта поездки",
};

export default ui;
