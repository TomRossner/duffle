import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const map: Translation<Messages["map"]> = {
  page: {
    heading: "Направления",
    sub: "Каждая остановка — это место и дни, когда вы там.",
    addTitle: "Добавить направление",
    addDescription: "Найдите город или место и укажите дни, когда вы там будете.",
    emptyTitle: "Направлений пока нет",
    emptyBody: "Добавьте каждый город или остановку поездки с датами. Они отмечаются на карте, получают прогноз погоды и хранят запланированные там занятия. Начните с «Добавить направление» выше.",
    activities: "Занятия",
    nothingHere: "На этой остановке пока ничего не запланировано.",
  },
  form: {
    place: "Место",
    name: "Название",
    rename: "Переименовать",
    clear: "Очистить",
    address: "Адрес",
    latitude: "Широта",
    longitude: "Долгота",
    usePlace: "Использовать {name}",
    searchHint: "Найдите и выберите результат — так ставится метка.",
    enterYourself: "Указать место вручную",
    firstDay: "Первый день",
    lastDay: "Последний день",
    note: "Заметка",
    optional: "Необязательно",
    addDestination: "Добавить направление",
  },
  card: {
    confirmRemove: "Точно удалить {name} и его занятия?",
    editTitle: "Изменить {name}",
  },
  search: {
    placeholder: "Найти город или место",
    searching: "Ищем",
    search: "Найти",
  },
  view: {
    noKey: "Добавьте GOOGLE_MAPS_API_KEY, чтобы показать Google Maps. Добавленные направления всё равно будут в списке.",
    addOne: "Добавьте направление, чтобы увидеть его на карте.",
    sketchNoKey: "Эта схема использует сохранённые координаты. Google Maps загрузится, когда задан GOOGLE_MAPS_API_KEY.",
    sketchFailed: "Google Maps не загрузились с этим ключом. Направления по-прежнему видны на схеме координат.",
  },
  errors: {
    signIn: "Войдите, чтобы искать места.",
    nameDestination: "Назовите направление.",
    choosePlace: "Выберите место из поиска или укажите его координаты.",
    chooseDates: "Выберите даты, когда вы там будете.",
    lastAfterFirst: "Последний день должен быть не раньше первого.",
    insideTrip: "Даты направления должны быть в пределах поездки.",
    destinationNotFound: "Направление не найдено.",
    nameActivity: "Назовите занятие.",
    activityNotFound: "Занятие не найдено.",
    noKey: "Добавьте GOOGLE_MAPS_API_KEY, чтобы искать места. Название и координаты можно ввести и так.",
    searchFailed: "Поиск места не удался. Проверьте ключ Google Maps и включённые API.",
  },
};

export default map;
