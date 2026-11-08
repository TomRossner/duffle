import account from "./account";
import auth from "./auth";
import common from "./common";
import mail from "./mail";
import nav from "./nav";
import notifications from "./notifications";
import profile from "./profile";
import trips from "./trips";

export const messages = {
  account,
  auth,
  common,
  mail,
  nav,
  notifications,
  profile,
  trips,
};

export type Messages = typeof messages;
