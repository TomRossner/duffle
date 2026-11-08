import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const ui: Translation<Messages["ui"]> = {
  openEmailLink: "פתיחת הקישור מהמייל",
  smtpNote: " (מוצג כי SMTP לא מוגדר)",
  inviteLinkHint: "שתפו את הקישור עם המטייל. הוא מתאים למייל שהזנתם.",
  confirmTitle: "בטוח?",
  confirmGeneric: "לבצע את הפעולה?",
  costOptional: "עלות (לא חובה)",
  currency: "מטבע",
  rateOptional: "שער חליפין (לא חובה)",
  rateNotNeeded: "לא נדרש",
  ratePlaceholder: "1 {currency} = ? {base}",
  rateSame: "סכומים ב-{base} לא צריכים המרה.",
  rateHint: "כמה {base} שווה {currency} אחד. השאירו ריק כדי להשתמש בשער של אותו יום.",
  tripCurrency: "מטבע הטיול",
};

export default ui;
