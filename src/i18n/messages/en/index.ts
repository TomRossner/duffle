import account from "./account";
import auth from "./auth";
import common from "./common";
import labels from "./labels";
import mail from "./mail";
import map from "./map";
import money from "./money";
import nav from "./nav";
import notifications from "./notifications";
import profile from "./profile";
import schedule from "./schedule";
import trips from "./trips";
import ui from "./ui";

export const messages = {
  account,
  auth,
  common,
  labels,
  mail,
  map,
  money,
  nav,
  notifications,
  profile,
  schedule,
  trips,
  ui,
};

export type Messages = typeof messages;
