import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const weather: Translation<Messages["weather"]> = {
  heading: "תחזית",
  sub: "מזג האוויר היומי מ-Open-Meteo לפי התאריכים של כל יעד.",
  emptyTitle: "אין עדיין תחזית",
  addDestination: "הוספת יעד",
  emptyBody: "התחזית עוקבת אחרי היעדים שלכם. הוסיפו על המפה את המקומות שאליהם אתם נוסעים, עם התאריכים, ומזג האוויר היומי יופיע כאן.",
  noDays: "אין עדיין תחזית. לחצו על „טעינת תחזית” למעלה כשנשארו כשבועיים לטיול.",
  mm: "{value} מ״מ",
  kmh: "{value} קמ״ש",
  load: "טעינת תחזית",
  loading: "טוען תחזית...",
  saved: {
    one: "נשמר יום אחד.",
    other: "נשמרו {count} ימים.",
  },
  errors: {
    noDestinations: "הוסיפו יעד לפני טעינת מזג האוויר.",
    tooEarly: "מוקדם מדי לתחזית. חזרו כשבועיים לפני הטיול.",
    failed: "לא ניתן לטעון את התחזית כרגע. נסו שוב בעוד זמן מה.",
  },
};

export default weather;
