import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const notifications: Translation<Messages["notifications"]> = {
  someone: "Участник",
  someoneLower: "участнику",
  theTrip: "поездке",
  joined: {
    title: "Новый участник",
    body: "{name} присоединяется к поездке «{trip}».",
  },
  invited: {
    title: "Приглашение в поездку",
    body: "Вас пригласили в поездку «{trip}».",
  },
  plannedAdded: {
    title: "Добавлен плановый расход",
    body: "{name}: добавлено «{item}».",
  },
  budgetRowAdded: {
    title: "Добавлен плановый расход",
    body: "{name}: добавлено «{item}» из таблицы бюджета.",
  },
  budgetImported: {
    title: "Таблица бюджета импортирована",
    body: {
      one: "{name}: импортирована {count} таблица бюджета.",
      few: "{name}: импортировано {count} таблицы бюджета.",
      many: "{name}: импортировано {count} таблиц бюджета.",
      other: "{name}: импортировано {count} таблицы бюджета.",
    },
  },
  documentAdded: {
    title: "Добавлен документ",
    body: "{name}: добавлено «{item}».",
  },
  documentUpdated: {
    title: "Документ изменён",
    body: "{name}: изменено «{item}».",
  },
  documentRemoved: {
    title: "Документ удалён",
    body: "{name}: удалено «{item}».",
  },
  expenseAdded: {
    title: "Добавлен расход",
    body: "{name}: добавлено «{item}».",
  },
  expenseUpdated: {
    title: "Расход изменён",
    body: "{name}: изменено «{item}».",
  },
  expenseRemoved: {
    title: "Расход удалён",
    body: "{name}: удалено «{item}».",
  },
  expensePaid: {
    title: "Расход оплачен",
    body: "{name}: «{item}» отмечено как оплаченное.",
  },
  expenseUnpaid: {
    title: "Расход не оплачен",
    body: "{name}: «{item}» отмечено как неоплаченное.",
  },
  settlement: {
    title: "Платёж записан",
    body: "{name} → {to}: платёж записан.",
  },
  insuranceAdded: {
    title: "Добавлена страховка",
    body: "{name}: добавлено «{item}».",
  },
  insuranceUpdated: {
    title: "Страховка изменена",
    body: "{name}: изменено «{item}».",
  },
  insuranceRemoved: {
    title: "Страховка удалена",
    body: "{name}: удалено «{item}».",
  },
  flightAdded: {
    title: "Добавлен рейс",
    body: "{name}: добавлен рейс {item}.",
  },
  flightsAdded: {
    title: "Добавлены рейсы",
    body: "{name}: добавлены рейсы {item}.",
  },
  flightUpdated: {
    title: "Рейс изменён",
    body: "{name}: изменён рейс {item}.",
  },
  flightRemoved: {
    title: "Рейс удалён",
    body: "{name}: удалён рейс {item}.",
  },
  flightChanged: {
    title: "Изменения в рейсе {item}",
    body: "{route}: {changes}.",
  },
  stayAdded: {
    title: "Добавлено жильё",
    body: "{name}: добавлено «{item}».",
  },
  stayUpdated: {
    title: "Жильё изменено",
    body: "{name}: изменено «{item}».",
  },
  stayRemoved: {
    title: "Жильё удалено",
    body: "{name}: удалено «{item}».",
  },
  planAdded: {
    title: "Расписание обновлено",
    body: {
      one: "{name}: добавлено «{item}» на {count} день.",
      few: "{name}: добавлено «{item}» на {count} дня.",
      many: "{name}: добавлено «{item}» на {count} дней.",
      other: "{name}: добавлено «{item}» на {count} дня.",
    },
  },
  planUpdated: {
    title: "Расписание обновлено",
    body: {
      one: "{name}: изменено «{item}» на {count} день.",
      few: "{name}: изменено «{item}» на {count} дня.",
      many: "{name}: изменено «{item}» на {count} дней.",
      other: "{name}: изменено «{item}» на {count} дня.",
    },
  },
  planRemoved: {
    title: "Расписание обновлено",
    body: "{name}: удалено «{item}».",
  },
  bell: {
    label: "Уведомления",
    labelUnread: "Уведомления, непрочитанных: {count}",
    fresh: "Новых: {count}",
    close: "Закрыть уведомления",
    caughtUp: "Новых уведомлений нет",
    caughtUpHint: "Здесь появятся приглашения, изменения и напоминания.",
    new: "Новые",
    earlier: "Ранее",
    pushReady: "Уведомления включены на этом устройстве.",
    pushDenied: "Уведомления заблокированы в настройках браузера.",
    pushUnsupported: "Этот браузер не может показывать уведомления.",
    pushOffer: "Получайте уведомления на этом устройстве, даже когда Duffle закрыт.",
    turnOn: "Включить",
    justNow: "только что",
  },
};

export default notifications;
