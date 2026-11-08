import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const account: Translation<Messages["account"]> = {
  actions: "פעולות חשבון",
  changePassword: "שינוי סיסמה",
  changePasswordHint: "יש להזין את הסיסמה הנוכחית ואז לבחור סיסמה חדשה.",
  updatePassword: "עדכון הסיסמה",
  currentPassword: "סיסמה נוכחית",
  newPassword: "סיסמה חדשה",
  confirmNewPassword: "אימות הסיסמה החדשה",
  deleteAccount: "מחיקת החשבון",
  deleteMessage: "הפרופיל, הארון והמסמכים האישיים שלך יימחקו. טיולים שיש בהם מטיילים נוספים יישארו, ומנהל אחר יהיה אחראי עליהם. הוצאות משותפות יישמרו עם \"מטייל שנמחק\" כדי שהיתרות ימשיכו להסתדר.",
  languageHint: "השפה שבה Duffle פונה אליך, כולל מיילים והתראות.",
  languageSaved: "השפה עודכנה",
};

export default account;
