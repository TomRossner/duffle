import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const account: Translation<Messages["account"]> = {
  actions: "Действия с аккаунтом",
  changePassword: "Сменить пароль",
  changePasswordHint: "Введите текущий пароль, затем выберите новый.",
  updatePassword: "Обновить пароль",
  currentPassword: "Текущий пароль",
  newPassword: "Новый пароль",
  confirmNewPassword: "Повторите новый пароль",
  deleteAccount: "Удалить аккаунт",
  deleteMessage: "Ваш профиль, гардероб и личные документы будут удалены. Поездки, в которых есть другие участники, сохранятся, и ими займётся другой администратор. В общих расходах останется «Удалённый участник», чтобы балансы сходились.",
  languageHint: "Язык, на котором Duffle общается с вами, в том числе в письмах и уведомлениях.",
  languageSaved: "Язык изменён",
};

export default account;
