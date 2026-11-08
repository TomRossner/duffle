import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const mail: Translation<Messages["mail"]> = {
  buttonFallback: "אם הכפתור לא עובד, אפשר להדביק את הקישור הזה בדפדפן:",
  tagline: "Duffle · מקום אחד לכל הטיול.",
  notConfigured: "שליחת מיילים עדיין לא הוגדרה.",
  sendFailed: "לא הצלחנו לשלוח את המייל. אפשר לנסות שוב.",
  verify: {
    subject: "אימות החשבון שלך ב-Duffle",
    heading: "אימות כתובת המייל",
    body: "ברוכים הבאים ל-Duffle! יש לאמת את {email} כדי לסיים את הגדרת החשבון.",
    action: "אימות המייל",
    note: "הקישור בתוקף ל-24 שעות. אם לא יצרת חשבון, אפשר להתעלם מהמייל הזה.",
  },
  existing: {
    subject: "החשבון שלך ב-Duffle",
    heading: "כבר יש לך חשבון",
    google: "החשבון של {email} מתחבר עם Google. יש להתחבר עם Google כדי לחזור לטיולים שלך.",
    password: "כבר קיים חשבון עבור {email}. אפשר להתחבר, או לאפס את הסיסמה אם שכחת אותה.",
    signInGoogle: "התחברות עם Google",
    signIn: "התחברות",
    resetPassword: "איפוס סיסמה",
    note: "אם לא ביקשת את זה, אפשר להתעלם מהמייל הזה.",
  },
  reset: {
    subject: "איפוס הסיסמה שלך ב-Duffle",
    heading: "איפוס הסיסמה",
    body: "קיבלנו בקשה לאפס את הסיסמה של {email}. אפשר לבחור סיסמה חדשה כאן.",
    action: "איפוס סיסמה",
    note: "הקישור בתוקף לשעה אחת. אם לא ביקשת את זה, אפשר להתעלם מהמייל, והסיסמה לא תשתנה.",
  },
};

export default mail;
