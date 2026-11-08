import account from "./account";
import auth from "./auth";
import closet from "./closet";
import common from "./common";
import documents from "./documents";
import guide from "./guide";
import insurance from "./insurance";
import labels from "./labels";
import mail from "./mail";
import map from "./map";
import money from "./money";
import nav from "./nav";
import notifications from "./notifications";
import packing from "./packing";
import profile from "./profile";
import schedule from "./schedule";
import trips from "./trips";
import ui from "./ui";
import weather from "./weather";

export const messages = {
  account,
  auth,
  closet,
  common,
  documents,
  guide,
  insurance,
  labels,
  mail,
  map,
  money,
  nav,
  notifications,
  packing,
  profile,
  schedule,
  trips,
  ui,
  weather,
};

export type Messages = typeof messages;
