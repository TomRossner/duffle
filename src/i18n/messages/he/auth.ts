import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const auth: Translation<Messages["auth"]> = {
  home: "דף הבית של Duffle",
  orEmail: "או להמשיך עם מייל",
  continueGoogle: "המשך עם Google",
  email: "מייל",
  password: "סיסמה",
  confirmPassword: "אימות סיסמה",
  newPassword: "סיסמה חדשה",
  name: "שם",
  emailPlaceholder: "name@example.com",
  login: {
    title: "ברוכים השבים",
    description: "התחברו כדי לתכנן, לארוז ולחלק הוצאות עם קבוצת הטיול.",
    noAccount: "עדיין אין לך חשבון? <link>ליצירת חשבון</link>",
    submit: "התחברות",
    forgot: "שכחת סיסמה?",
  },
  register: {
    title: "יצירת חשבון",
    description: "אפשר להירשם עם Google או למלא את הפרטים. נשלח לך קישור במייל לאימות הכתובת.",
    haveAccount: "כבר יש לך חשבון? <link>התחברות</link>",
    submit: "יצירת חשבון",
    account: "חשבון",
    aboutYou: "עליך",
    passwordHint: "לפחות 8 תווים.",
  },
  forgot: {
    title: "איפוס סיסמה",
    description: "נשלח קישור במייל אם הכתובת הזו משתמשת בסיסמה.",
    submit: "שליחת קישור לאיפוס",
    backToSignIn: "חזרה להתחברות",
  },
  reset: {
    title: "בחירת סיסמה חדשה",
    description: "הפעולה תנתק גם את כל שאר החיבורים לחשבון.",
    submit: "שמירת הסיסמה",
    missing: "קישור האיפוס חסר.",
    requestNew: "בקשת קישור חדש",
  },
  verify: {
    title: "אימות כתובת המייל",
    description: "כך מוודאים שהכתובת שייכת לך לפני התחברות או הצטרפות לטיול.",
    submit: "אימות המייל",
    missing: "קישור האימות חסר.",
  },
  google: {
    configuration: "ההתחברות עם Google נכשלה בשרת. אפשר לנסות שוב או להשתמש במייל וסיסמה.",
    accessDenied: "Google לא אישרה את כתובת המייל הזו.",
    failed: "ההתחברות עם Google נכשלה. אפשר לנסות שוב.",
  },
  notices: {
    verified: "המייל אומת. אפשר להתחבר.",
    password: "הסיסמה עודכנה. יש להתחבר עם הסיסמה החדשה. שאר החיבורים נותקו.",
    reset: "הסיסמה עודכנה. יש להתחבר עם הסיסמה החדשה.",
    confirm: "יש לאמת את המייל לפני הצטרפות לטיול.",
  },
  messages: {
    accountMail: "כדאי לבדוק את המייל. אם אפשר ליצור חשבון עם הכתובת הזו, שלחנו קישור.",
    resetSent: "אם לכתובת הזו יש חשבון עם סיסמה, שלחנו קישור לאיפוס.",
  },
  errors: {
    nameShort: "השם צריך להכיל לפחות 2 תווים.",
    email: "יש להזין כתובת מייל תקינה.",
    passwordShort: "הסיסמה צריכה להכיל לפחות 8 תווים.",
    passwordMismatch: "הסיסמאות לא תואמות.",
    passwordSame: "יש לבחור סיסמה אחרת.",
    passwordWrong: "הסיסמה הנוכחית שגויה.",
    googleAccount: "החשבון הזה מתחבר עם Google.",
    noMailRegister: "חשבון עם סיסמה דורש שליחת מיילים. אפשר להתחבר עם Google או להגדיר SMTP.",
    noMailReset: "איפוס סיסמה דורש שליחת מיילים. אפשר להגדיר SMTP או להתחבר עם Google.",
    invalidLogin: "המייל או הסיסמה שגויים.",
    confirmFirst: "יש לאמת את המייל לפני ההתחברות. שלחנו קישור חדש.",
    linkInvalid: "הקישור לא תקין או שפג תוקפו.",
    tooMany: "יותר מדי ניסיונות. אפשר לנסות שוב מאוחר יותר.",
    deleteFailed: "לא הצלחנו למחוק את החשבון.",
  },
};

export default auth;
