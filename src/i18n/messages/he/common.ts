import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const common: Translation<Messages["common"]> = {
  save: "שמירה",
  saving: "שומר...",
  cancel: "ביטול",
  close: "סגירה",
  remove: "הסרה",
  removing: "מסיר...",
  edit: "עריכה",
  delete: "מחיקה",
  deleting: "מוחק...",
  back: "חזרה",
  tryAgain: "לנסות שוב",
  goHome: "לדף הבית",
  gotIt: "הבנתי",
  notAdded: "לא נוסף",
  copy: "העתקה",
  copied: "הועתק",
  actionsFor: "פעולות עבור {name}",
  confirmRemove: "בטוח שרוצים להסיר את {name}?",
  openMenu: "פתיחת התפריט",
  closeMenu: "סגירת התפריט",
  signIn: "התחברות",
  signUp: "הרשמה",
  signOut: "התנתקות",
  logOut: "התנתקות",
  you: "אני",
  language: "שפה",
  or: "או",
  and: "ו",
  days: {
    one: "יום אחד",
    two: "יומיים",
    other: "{count} ימים",
  },
  nights: {
    one: "לילה אחד",
    two: "שני לילות",
    other: "{count} לילות",
  },
  travelers: {
    one: "מטייל אחד",
    other: "{count} מטיילים",
  },
  cookies: {
    label: "הודעת עוגיות",
    text: "האתר משתמש בעוגיות כדי לשמור על החיבור שלך ולזכור את ההעדפות שלך.",
  },
  notFound: {
    title: "הדף לא נמצא",
    heading: "הדף הזה לא מופיע במפה.",
    body: "ייתכן שהקישור ישן, או שהדף הוסר.",
  },
  error: {
    heading: "משהו השתבש.",
    body: "לא הצלחנו לטעון את הדף. אפשר לנסות שוב.",
    generic: "משהו השתבש. אפשר לנסות שוב.",
  },
};

export default common;
