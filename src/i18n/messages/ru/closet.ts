import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const closet: Translation<Messages["closet"]> = {
  title: "Гардероб",
  subtitle: "Эти вещи видите только вы. Поездки используют их, чтобы подсказать, что взять.",
  board: {
    search: "Поиск",
    searchPlaceholder: "Название или описание",
    type: "Тип",
    allTypes: "Все типы",
    empty: "Вещей пока нет.",
    noMatch: "Ничего не найдено.",
    outerwear: "Верхняя одежда",
    accessories: "Аксессуары",
  },
  fields: {
    name: "Название",
    type: "Тип",
    quantity: "Количество",
    coolest: "Мин. °C",
    warmest: "Макс. °C",
    description: "Описание",
    weather: "Погода",
    activities: "Занятия",
    features: "Особенности",
  },
  card: {
    noTags: "Без меток",
    editTitle: "Изменить «{name}»",
    editDescription: "Измените тип, погоду или занятия.",
    confirmDelete: "Точно удалить «{name}»?",
  },
  add: {
    button: "Добавить вещь",
    description: "Добавьте фото, и данные заполнятся сами. Проверьте их и сохраните.",
    submit: "Добавить в гардероб",
  },
  image: {
    photo: "Фото",
    badType: "Используйте JPEG, PNG, WebP или GIF.",
    tooBig: "Изображение больше 5 МБ. Выберите файл поменьше.",
    filled: "Данные заполнены по фото. Проверьте их перед сохранением.",
    kept: "Введённые данные сохранены.",
    fileMeta: "Изображение · {size} · Нажмите или перетащите, чтобы заменить",
    prompt: "<em>Загрузите изображение</em> или перетащите его сюда",
    formats: "JPEG, PNG, WebP или GIF, до 5 МБ.",
    autoFill: "Данные заполнятся сами.",
    reading: "Смотрим на фото…",
    pasteUrl: "Или вставьте ссылку на изображение",
    keepCurrent: "Оставьте оба поля пустыми, чтобы сохранить текущее фото.",
  },
  errors: {
    name: "Назовите вещь.",
    slot: "Выберите тип одежды.",
    quantity: "Количество должно быть целым числом от 1 до 99.",
    imageUrl: "Ссылка на изображение должна начинаться с http:// или https://.",
    tempNumbers: "Диапазон температур должен быть числами.",
    tempOrder: "Максимум должен быть не меньше минимума.",
    chooseImage: "Выберите изображение.",
    notClothing: "Это не похоже на одежду. Заполните данные вручную.",
    readFailed: "Не удалось прочитать фото. Заполните данные вручную.",
    notFound: "Вещь не найдена.",
  },
};

export default closet;
