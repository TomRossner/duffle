import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const map: Translation<Messages["map"]> = {
  page: {
    heading: "יעדים",
    sub: "כל תחנה היא מקום והימים שבהם אתם שם.",
    addTitle: "הוספת יעד",
    addDescription: "חפשו עיר או מקום, ואז קבעו את הימים שבהם תהיו שם.",
    emptyTitle: "אין עדיין יעדים",
    emptyBody: "הוסיפו כל עיר או תחנה בטיול עם התאריכים שלה. הן מסומנות על המפה, מקבלות תחזית מזג אוויר ומכילות את הפעילויות שתכננתם שם. התחילו עם „הוספת יעד” למעלה.",
    activities: "פעילויות",
    nothingHere: "עדיין לא תוכנן כלום בתחנה הזו.",
  },
  form: {
    place: "מקום",
    name: "שם",
    rename: "שינוי שם",
    clear: "ניקוי",
    address: "כתובת",
    latitude: "קו רוחב",
    longitude: "קו אורך",
    usePlace: "שימוש ב{name}",
    searchHint: "חפשו ובחרו תוצאה. כך נקבעת הסיכה.",
    enterYourself: "הזנת מיקום ידנית",
    firstDay: "יום ראשון",
    lastDay: "יום אחרון",
    note: "הערה",
    optional: "לא חובה",
    addDestination: "הוספת יעד",
  },
  card: {
    confirmRemove: "להסיר את {name} ואת הפעילויות שלו?",
    editTitle: "עריכת {name}",
  },
  search: {
    placeholder: "חיפוש עיר או מקום",
    searching: "מחפש",
    search: "חיפוש",
  },
  view: {
    noKey: "הוסיפו GOOGLE_MAPS_API_KEY כדי להציג את Google Maps. היעדים שתוסיפו עדיין יופיעו ברשימה.",
    addOne: "הוסיפו יעד כדי לראות אותו על המפה.",
    sketchNoKey: "השרטוט הזה משתמש בקואורדינטות ששמרתם. Google Maps נטען כש-GOOGLE_MAPS_API_KEY מוגדר.",
    sketchFailed: "Google Maps לא נטען עם המפתח הזה. היעדים עדיין מוצגים בשרטוט הקואורדינטות.",
  },
  errors: {
    signIn: "התחברו כדי לחפש מקומות.",
    nameDestination: "תנו שם ליעד.",
    choosePlace: "בחרו מקום מהחיפוש, או הזינו את המיקום שלו.",
    chooseDates: "בחרו את התאריכים שבהם תהיו שם.",
    lastAfterFirst: "היום האחרון חייב להיות ביום הראשון או אחריו.",
    insideTrip: "תאריכי היעד חייבים להיות בתוך הטיול.",
    destinationNotFound: "היעד לא נמצא.",
    nameActivity: "תנו שם לפעילות.",
    activityNotFound: "הפעילות לא נמצאה.",
    noKey: "הוסיפו GOOGLE_MAPS_API_KEY כדי לחפש מקומות. עדיין אפשר להזין שם וקואורדינטות.",
    searchFailed: "חיפוש המקום נכשל. בדקו את מפתח Google Maps ואת ה-APIs המופעלים.",
  },
};

export default map;
