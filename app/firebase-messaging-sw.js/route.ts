import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const script = `importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");
firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const conversationId = data.conversationId || "";
  self.registration.showNotification(data.title || "New message", {
    body: data.body || "You have a new chat message.",
    data: { conversationId },
    tag: conversationId ? "conversation-" + conversationId : "admin-chat",
    renotify: true,
  });
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const conversationId = event.notification.data && event.notification.data.conversationId;
  const target = "/admin/chat" + (conversationId ? "?conversation=" + encodeURIComponent(conversationId) : "");
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (client.url.includes("/admin/chat") && "focus" in client) return client.focus().then(() => client.navigate(target));
    }
    return self.clients.openWindow(target);
  }));
});`;
  return new NextResponse(script, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" } });
}
