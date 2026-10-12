self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Waypoint", {
      body: data.body || "",
      data: { href: data.href || "/trips" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/trips";
  event.waitUntil(clients.openWindow(href));
});
