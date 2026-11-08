const weather = {
  heading: "Forecast",
  sub: "Daily conditions from Open-Meteo for each destination's dates.",
  emptyTitle: "No forecast yet",
  addDestination: "Add a destination",
  emptyBody: "The forecast follows your destinations. Add the places you're going on the map, with their dates, and their daily weather shows up here.",
  noDays: "No forecast yet. Use Load forecast above once the trip is about two weeks away.",
  mm: "{value} mm",
  kmh: "{value} km/h",
  load: "Load forecast",
  loading: "Loading forecast...",
  saved: {
    one: "Saved {count} day.",
    other: "Saved {count} days.",
  },
  errors: {
    noDestinations: "Add a destination before loading weather.",
    tooEarly: "It's too early for a forecast. Check back about two weeks before your trip.",
    failed: "Couldn't load the forecast right now. Try again in a little while.",
  },
};

export default weather;
