const notifications = {
  someone: "A traveler",
  someoneLower: "a traveler",
  theTrip: "the trip",
  joined: {
    title: "New traveler",
    body: "{name} joined {trip}.",
  },
  invited: {
    title: "Trip invitation",
    body: "You are invited to {trip}.",
  },
  plannedAdded: {
    title: "Planned cost added",
    body: "{name} added {item}.",
  },
  budgetRowAdded: {
    title: "Planned cost added",
    body: "{name} added {item} from a budget sheet.",
  },
  budgetImported: {
    title: "Budget sheet imported",
    body: {
      one: "{name} imported {count} budget table.",
      other: "{name} imported {count} budget tables.",
    },
  },
  documentAdded: {
    title: "Document added",
    body: "{name} added {item}.",
  },
  documentUpdated: {
    title: "Document updated",
    body: "{name} updated {item}.",
  },
  documentRemoved: {
    title: "Document removed",
    body: "{name} removed {item}.",
  },
  expenseAdded: {
    title: "Expense added",
    body: "{name} added {item}.",
  },
  expenseUpdated: {
    title: "Expense updated",
    body: "{name} updated {item}.",
  },
  expenseRemoved: {
    title: "Expense removed",
    body: "{name} removed {item}.",
  },
  expensePaid: {
    title: "Expense marked paid",
    body: "{name} marked {item} as paid.",
  },
  expenseUnpaid: {
    title: "Expense marked unpaid",
    body: "{name} marked {item} as unpaid.",
  },
  settlement: {
    title: "Settlement recorded",
    body: "{name} paid {to}.",
  },
  insuranceAdded: {
    title: "Insurance added",
    body: "{name} added {item}.",
  },
  insuranceUpdated: {
    title: "Insurance updated",
    body: "{name} updated {item}.",
  },
  insuranceRemoved: {
    title: "Insurance removed",
    body: "{name} removed {item}.",
  },
  flightAdded: {
    title: "Flight added",
    body: "{name} added {item}.",
  },
  flightsAdded: {
    title: "Flights added",
    body: "{name} added {item}.",
  },
  flightUpdated: {
    title: "Flight updated",
    body: "{name} updated {item}.",
  },
  flightRemoved: {
    title: "Flight removed",
    body: "{name} removed {item}.",
  },
  flightChanged: {
    title: "{item} changed",
    body: "{route}: {changes}.",
  },
  stayAdded: {
    title: "Stay added",
    body: "{name} added {item}.",
  },
  stayUpdated: {
    title: "Stay updated",
    body: "{name} updated {item}.",
  },
  stayRemoved: {
    title: "Stay removed",
    body: "{name} removed {item}.",
  },
  planAdded: {
    title: "Schedule updated",
    body: {
      one: "{name} added {item}.",
      other: "{name} added {item} on {count} days.",
    },
  },
  planUpdated: {
    title: "Schedule updated",
    body: {
      one: "{name} updated {item}.",
      other: "{name} updated {item} on {count} days.",
    },
  },
  planRemoved: {
    title: "Schedule updated",
    body: "{name} removed {item}.",
  },
  bell: {
    label: "Notifications",
    labelUnread: "Notifications, {count} unread",
    fresh: "{count} new",
    close: "Close notifications",
    caughtUp: "You're all caught up",
    caughtUpHint: "Trip invites, changes and reminders will show up here.",
    new: "New",
    earlier: "Earlier",
    pushReady: "Alerts are on for this device.",
    pushDenied: "Notifications are blocked in this browser's settings.",
    pushUnsupported: "This browser can't show alerts.",
    pushOffer: "Get alerts on this device, even when Duffle is closed.",
    turnOn: "Turn on",
    justNow: "just now",
  },
};

export default notifications;
