import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const closet: Translation<Messages["closet"]> = {
  title: "ארון",
  subtitle: "רק אתם רואים את הפריטים האלה. הטיולים משתמשים בהם כדי להציע מה לארוז.",
  board: {
    search: "חיפוש",
    searchPlaceholder: "שם או תיאור",
    type: "סוג",
    allTypes: "כל הסוגים",
    empty: "אין עדיין פריטים.",
    noMatch: "אין פריטים תואמים.",
    outerwear: "הלבשה עליונה",
    accessories: "אביזרים",
  },
  fields: {
    name: "שם",
    type: "סוג",
    quantity: "כמות",
    coolest: "הכי קר °C",
    warmest: "הכי חם °C",
    description: "תיאור",
    weather: "מזג אוויר",
    activities: "פעילויות",
    features: "תכונות",
  },
  card: {
    noTags: "אין תגיות",
    editTitle: "עריכת {name}",
    editDescription: "שינוי הסוג, מזג האוויר או הפעילויות.",
    confirmDelete: "למחוק את \"{name}\"?",
  },
  add: {
    button: "הוספת פריט",
    description: "הוסיפו תמונה והפרטים ימולאו בשבילכם. בדקו אותם ושמרו.",
    submit: "הוספה לארון",
  },
  image: {
    photo: "תמונה",
    badType: "השתמשו ב-JPEG,‏ PNG,‏ WebP או GIF.",
    tooBig: "התמונה גדולה מ-5MB. בחרו קובץ קטן יותר.",
    filled: "הפרטים מולאו מהתמונה. בדקו אותם לפני השמירה.",
    kept: "הפרטים שהזנתם נשמרו.",
    fileMeta: "תמונה · {size} · לחצו או גררו כדי להחליף",
    prompt: "<em>העלו תמונה</em> או גררו אותה לכאן",
    formats: "JPEG,‏ PNG,‏ WebP או GIF, עד 5MB.",
    autoFill: "הפרטים ימולאו בשבילכם.",
    reading: "בודק את התמונה…",
    pasteUrl: "או הדביקו כתובת של תמונה",
    keepCurrent: "השאירו את שני שדות התמונה ריקים כדי לשמור את התמונה הנוכחית.",
  },
  errors: {
    name: "תנו שם לפריט.",
    slot: "בחרו איזה סוג בגד זה.",
    quantity: "הכמות חייבת להיות מספר שלם בין 1 ל-99.",
    imageUrl: "כתובת התמונה חייבת להתחיל ב-http://‎ או https://‎.",
    tempNumbers: "טווח הטמפרטורות חייב להיות מספרים.",
    tempOrder: "הקצה החם של הטווח חייב להיות לפחות כמו הקצה הקר.",
    chooseImage: "בחרו תמונה.",
    notClothing: "זה לא נראה כמו בגד. מלאו את הפרטים בעצמכם.",
    readFailed: "לא ניתן לקרוא את התמונה. מלאו את הפרטים בעצמכם.",
    notFound: "הפריט לא נמצא.",
  },
};

export default closet;
