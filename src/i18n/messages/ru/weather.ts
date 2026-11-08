import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const weather: Translation<Messages["weather"]> = {
  heading: "Прогноз",
  sub: "Погода по дням от Open-Meteo на даты каждого направления.",
  emptyTitle: "Прогноза пока нет",
  addDestination: "Добавить направление",
  emptyBody: "Прогноз строится по вашим направлениям. Добавьте на карте места, куда едете, с датами, и их погода по дням появится здесь.",
  noDays: "Прогноза пока нет. Нажмите «Загрузить прогноз» выше примерно за две недели до поездки.",
  mm: "{value} мм",
  kmh: "{value} км/ч",
  load: "Загрузить прогноз",
  loading: "Загружаем прогноз...",
  saved: {
    one: "Сохранён {count} день.",
    few: "Сохранено {count} дня.",
    many: "Сохранено {count} дней.",
    other: "Сохранено {count} дня.",
  },
  errors: {
    noDestinations: "Добавьте направление, прежде чем загружать погоду.",
    tooEarly: "Для прогноза ещё рано. Загляните примерно за две недели до поездки.",
    failed: "Не удалось загрузить прогноз. Попробуйте чуть позже.",
  },
};

export default weather;
