self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    data: { conversationId: data.conversationId },
    tag: `conversation-${data.conversationId}`,
    renotify: true,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const conversationId = event.notification.data?.conversationId;
  const target = `/admin/chat${conversationId ? `?conversation=${encodeURIComponent(conversationId)}` : ""}`;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ("focus" in client) return client.focus().then(() => client.navigate(target));
    }
    return clients.openWindow(target);
  }));
});
