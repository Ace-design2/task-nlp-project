/* eslint-disable no-restricted-globals */
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    const title = data.notification?.title || data.title || "Reminder";
    const options = {
      body: data.notification?.body || data.body || "Time is up!",
      icon: "/icon.png", // Ensure you have an icon.png in public folder
      badge: "/icon.png",
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});
