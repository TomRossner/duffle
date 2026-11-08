import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";
import account from "./account";
import auth from "./auth";
import common from "./common";
import mail from "./mail";
import nav from "./nav";
import notifications from "./notifications";
import profile from "./profile";
import trips from "./trips";

export const messages: Translation<Messages> = {
  account,
  auth,
  common,
  mail,
  nav,
  notifications,
  profile,
  trips,
};
