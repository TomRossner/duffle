import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";
import account from "./account";
import auth from "./auth";
import common from "./common";
import labels from "./labels";
import mail from "./mail";
import nav from "./nav";
import notifications from "./notifications";
import profile from "./profile";
import schedule from "./schedule";
import trips from "./trips";
import ui from "./ui";

export const messages: Translation<Messages> = {
  account,
  auth,
  common,
  labels,
  mail,
  nav,
  notifications,
  profile,
  schedule,
  trips,
  ui,
};
