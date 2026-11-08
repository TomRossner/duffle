import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const notifications: Translation<Messages["notifications"]> = {
  someone: "מטייל/ת",
  someoneLower: "מטייל/ת",
  theTrip: "הטיול",
  joined: {
    title: "מטייל חדש",
    body: "{name} הצטרף/ה ל{trip}.",
  },
  invited: {
    title: "הזמנה לטיול",
    body: "הוזמנת ל{trip}.",
  },
  plannedAdded: {
    title: "נוספה עלות מתוכננת",
    body: "{name} הוסיף/ה את {item}.",
  },
  budgetRowAdded: {
    title: "נוספה עלות מתוכננת",
    body: "{name} הוסיף/ה את {item} מגיליון תקציב.",
  },
  budgetImported: {
    title: "גיליון תקציב יובא",
    body: {
      one: "{name} ייבא/ה טבלת תקציב אחת.",
      other: "{name} ייבא/ה {count} טבלאות תקציב.",
    },
  },
  documentAdded: {
    title: "נוסף מסמך",
    body: "{name} הוסיף/ה את {item}.",
  },
  documentUpdated: {
    title: "מסמך עודכן",
    body: "{name} עדכן/ה את {item}.",
  },
  documentRemoved: {
    title: "מסמך הוסר",
    body: "{name} הסיר/ה את {item}.",
  },
  expenseAdded: {
    title: "נוספה הוצאה",
    body: "{name} הוסיף/ה את {item}.",
  },
  expenseUpdated: {
    title: "הוצאה עודכנה",
    body: "{name} עדכן/ה את {item}.",
  },
  expenseRemoved: {
    title: "הוצאה הוסרה",
    body: "{name} הסיר/ה את {item}.",
  },
  expensePaid: {
    title: "הוצאה סומנה כשולמה",
    body: "{name} סימן/ה את {item} כשולם.",
  },
  expenseUnpaid: {
    title: "הוצאה סומנה כלא שולמה",
    body: "{name} סימן/ה את {item} כלא שולם.",
  },
  settlement: {
    title: "נרשם תשלום",
    body: "{name} שילם/ה ל{to}.",
  },
  insuranceAdded: {
    title: "נוסף ביטוח",
    body: "{name} הוסיף/ה את {item}.",
  },
  insuranceUpdated: {
    title: "ביטוח עודכן",
    body: "{name} עדכן/ה את {item}.",
  },
  insuranceRemoved: {
    title: "ביטוח הוסר",
    body: "{name} הסיר/ה את {item}.",
  },
  flightAdded: {
    title: "נוספה טיסה",
    body: "{name} הוסיף/ה את {item}.",
  },
  flightsAdded: {
    title: "נוספו טיסות",
    body: "{name} הוסיף/ה את {item}.",
  },
  flightUpdated: {
    title: "טיסה עודכנה",
    body: "{name} עדכן/ה את {item}.",
  },
  flightRemoved: {
    title: "טיסה הוסרה",
    body: "{name} הסיר/ה את {item}.",
  },
  flightChanged: {
    title: "שינוי בטיסה {item}",
    body: "{route}: {changes}.",
  },
  stayAdded: {
    title: "נוספה לינה",
    body: "{name} הוסיף/ה את {item}.",
  },
  stayUpdated: {
    title: "לינה עודכנה",
    body: "{name} עדכן/ה את {item}.",
  },
  stayRemoved: {
    title: "לינה הוסרה",
    body: "{name} הסיר/ה את {item}.",
  },
  planAdded: {
    title: "לוח הזמנים עודכן",
    body: {
      one: "{name} הוסיף/ה את {item}.",
      other: "{name} הוסיף/ה את {item} ב-{count} ימים.",
    },
  },
  planUpdated: {
    title: "לוח הזמנים עודכן",
    body: {
      one: "{name} עדכן/ה את {item}.",
      other: "{name} עדכן/ה את {item} ב-{count} ימים.",
    },
  },
  planRemoved: {
    title: "לוח הזמנים עודכן",
    body: "{name} הסיר/ה את {item}.",
  },
  bell: {
    label: "התראות",
    labelUnread: "התראות, {count} שלא נקראו",
    fresh: "{count} חדשות",
    close: "סגירת ההתראות",
    caughtUp: "אין שום דבר חדש",
    caughtUpHint: "הזמנות לטיולים, שינויים ותזכורות יופיעו כאן.",
    new: "חדש",
    earlier: "קודם",
    pushReady: "ההתראות פעילות במכשיר הזה.",
    pushDenied: "ההתראות חסומות בהגדרות הדפדפן.",
    pushUnsupported: "הדפדפן הזה לא יכול להציג התראות.",
    pushOffer: "קבלת התראות במכשיר הזה, גם כש-Duffle סגור.",
    turnOn: "הפעלה",
    justNow: "עכשיו",
  },
};

export default notifications;
