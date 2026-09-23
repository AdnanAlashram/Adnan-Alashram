import webpush from "web-push";
import { prisma } from "@/lib/db";

function configurePush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendAdminPush(conversationId: string, visitorLabel: string, content: string) {
  if (!configurePush()) return;
  const subscriptions = await prisma.pushSubscription.findMany();
  const body = JSON.stringify({
    title: `New message from ${visitorLabel}`,
    body: content.slice(0, 120),
    conversationId,
  });

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        body,
      );
    } catch (error: unknown) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error
        ? (error as { statusCode?: number }).statusCode
        : undefined;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: subscription.id } });
      } else {
        console.error("WEB PUSH ERROR", error);
      }
    }
  }));
}
