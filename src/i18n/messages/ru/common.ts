import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const common: Translation<Messages["common"]> = {
  save: "Сохранить",
  saving: "Сохранение...",
  cancel: "Отмена",
  close: "Закрыть",
  remove: "Удалить",
  removing: "Удаление...",
  edit: "Изменить",
  delete: "Удалить",
  deleting: "Удаление...",
  back: "Назад",
  tryAgain: "Попробовать снова",
  goHome: "На главную",
  gotIt: "Понятно",
  notAdded: "Не указано",
  copy: "Копировать",
  copied: "Скопировано",
  actionsFor: "Действия: {name}",
  confirmRemove: "Удалить «{name}»?",
  openMenu: "Открыть меню",
  closeMenu: "Закрыть меню",
  signIn: "Войти",
  signUp: "Регистрация",
  signOut: "Выйти",
  logOut: "Выйти",
  you: "Вы",
  language: "Язык",
  or: "или",
  and: "и",
  days: {
    one: "{count} день",
    few: "{count} дня",
    many: "{count} дней",
    other: "{count} дня",
  },
  nights: {
    one: "{count} ночь",
    few: "{count} ночи",
    many: "{count} ночей",
    other: "{count} ночи",
  },
  travelers: {
    one: "{count} путешественник",
    few: "{count} путешественника",
    many: "{count} путешественников",
    other: "{count} путешественника",
  },
  cookies: {
    label: "Уведомление о cookie",
    text: "Сайт использует файлы cookie, чтобы вы оставались в аккаунте и сохранялись ваши настройки.",
  },
  notFound: {
    title: "Страница не найдена",
    heading: "Этой страницы нет на карте.",
    body: "Возможно, ссылка устарела или страница была удалена.",
  },
  error: {
    heading: "Что-то пошло не так.",
    body: "Не удалось загрузить страницу. Попробуйте ещё раз.",
    generic: "Что-то пошло не так. Попробуйте ещё раз.",
  },
};

export default common;
