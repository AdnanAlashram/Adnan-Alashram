const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { getMessaging } = require("firebase-admin/messaging");
const { onValueCreated } = require("firebase-functions/v2/database");
const { beforeUserCreated } = require("firebase-functions/v2/identity");
const { defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

initializeApp();
const database = getDatabase();
const adminEmailParam = defineString("ADMIN_EMAIL");

exports.assignAdminClaim = beforeUserCreated((event) => {
  const user = event.data;
  const adminEmail = adminEmailParam.value();
  if (!user?.email || !adminEmail || user.email.toLowerCase() !== adminEmail.toLowerCase()) return {};
  logger.info("Admin claim assigned during account creation", { email: user.email });
  return { customClaims: { admin: true } };
});

exports.notifyAdminDevices = onValueCreated("messages/{conversationId}/{messageId}", async (event) => {
  const message = event.data?.val();
  if (!message || message.senderRole !== "visitor") return;

  const conversationSnapshot = await database.ref(`conversations/${event.params.conversationId}`).get();
  const conversation = conversationSnapshot.val();
  if (!conversation) return;

  const devicesSnapshot = await database.ref("adminDevices").get();
  const tokens = [];
  devicesSnapshot.forEach((adminSnapshot) => {
    adminSnapshot.forEach((deviceSnapshot) => {
      const token = deviceSnapshot.child("token").val();
      if (typeof token === "string" && token) tokens.push({ token, path: deviceSnapshot.ref });
    });
  });
  if (!tokens.length) return;

  const visitorLabel = conversation.visitorName || `Visitor #${String(conversation.visitorId).slice(-4)}`;
  const response = await getMessaging().sendEachForMulticast({
    tokens: tokens.map(({ token }) => token),
    data: {
      title: `New message from ${visitorLabel}`,
      body: String(message.content).slice(0, 120),
      conversationId: event.params.conversationId,
      click_action: "/admin/chat",
    },
    webpush: {
      fcmOptions: { link: `/admin/chat?conversation=${encodeURIComponent(event.params.conversationId)}` },
    },
  });

  const invalidDevices = [];
  response.responses.forEach((result, index) => {
    const code = result.error?.code || "";
    if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) invalidDevices.push(tokens[index].path);
  });
  await Promise.all(invalidDevices.map((path) => path.remove()));
});

exports.updateConversationSummary = onValueCreated("messages/{conversationId}/{messageId}", async (event) => {
  const message = event.data?.val();
  if (!message) return;
  const conversationRef = database.ref(`conversations/${event.params.conversationId}`);
  const snapshot = await conversationRef.get();
  const conversation = snapshot.val();
  if (!conversation) return;
  await conversationRef.update({
    lastMessage: message,
    lastMessageAt: message.createdAt,
    updatedAt: Date.now(),
    status: "open",
    unreadForAdmin: Number(conversation.unreadForAdmin || 0) + (message.senderRole === "visitor" ? 1 : 0),
    unreadForVisitor: Number(conversation.unreadForVisitor || 0) + (message.senderRole === "admin" ? 1 : 0),
  });
});
