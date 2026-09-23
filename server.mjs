import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import webpush from "web-push";

const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number.parseInt(process.env.PORT || "3000", 10);
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();
const adminSockets = new Set();
const room = (id) => `conversation:${id}`;
const maxMessageLength = 2000;

const serializeMessage = (message) => ({ ...message, createdAt: message.createdAt.toISOString() });
const key = () => new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET);

async function getAdminFromToken(token) {
  if (!token || !process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.role !== "admin" || typeof payload.adminId !== "string") return null;
    return prisma.admin.findUnique({ where: { id: payload.adminId } });
  } catch { return null; }
}

async function getConversation(visitorId, visitorName) {
  return prisma.conversation.upsert({
    where: { visitorId },
    update: visitorName ? { visitorName: visitorName.slice(0, 80) } : {},
    create: { visitorId, visitorName: visitorName?.slice(0, 80) },
  });
}

async function summary(id) {
  const conversation = await prisma.conversation.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!conversation) return null;
  const unreadCount = await prisma.message.count({ where: { conversationId: id, senderRole: "visitor", readByAdmin: false } });
  return { id: conversation.id, visitorId: conversation.visitorId, visitorName: conversation.visitorName, status: conversation.status, lastMessageAt: conversation.lastMessageAt.toISOString(), createdAt: conversation.createdAt.toISOString(), unreadCount, lastMessage: conversation.messages[0] ? serializeMessage(conversation.messages[0]) : null };
}

async function allSummaries() {
  const conversations = await prisma.conversation.findMany({ orderBy: { lastMessageAt: "desc" } });
  return Promise.all(conversations.map(({ id }) => summary(id)));
}

async function sendPush(conversationId, label, content) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const subscriptions = await prisma.pushSubscription.findMany();
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: `New message from ${label}`, body: content.slice(0, 120), conversationId }));
    } catch (error) {
      const statusCode = error?.statusCode;
      if (statusCode === 404 || statusCode === 410) await prisma.pushSubscription.delete({ where: { id: subscription.id } });
      else console.error("WEB PUSH ERROR", error);
    }
  }));
}

function contentOf(value) {
  if (typeof value !== "string") return null;
  const content = value.trim();
  return content.length > 0 && content.length <= maxMessageLength ? content : null;
}

await nextApp.prepare();
const httpServer = createServer((request, response) => handle(request, response));
const io = new Server(httpServer, { cors: { origin: true, credentials: true } });

io.use(async (socket, nextMiddleware) => {
  const visitorId = typeof socket.handshake.auth?.visitorId === "string" ? socket.handshake.auth.visitorId : null;
  const token = (socket.handshake.headers.cookie || "").match(/(?:^|; )adnan_admin_session=([^;]+)/)?.[1];
  const admin = await getAdminFromToken(token);
  if (admin) { socket.data.role = "admin"; socket.data.adminId = admin.id; return nextMiddleware(); }
  if (visitorId && /^[a-zA-Z0-9-]{16,80}$/.test(visitorId)) { socket.data.role = "visitor"; socket.data.visitorId = visitorId; return nextMiddleware(); }
  return nextMiddleware(new Error("Authentication required"));
});

io.on("connection", (socket) => {
  const role = socket.data.role;
  if (role === "admin") adminSockets.add(socket.id);

  socket.on("visitor:join", async (payload = {}, callback) => {
    if (role !== "visitor") return callback?.({ error: "Forbidden" });
    const conversation = await getConversation(socket.data.visitorId, typeof payload.visitorName === "string" ? payload.visitorName.trim() : undefined);
    const messages = await prisma.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "asc" } });
    socket.join(room(conversation.id));
    callback?.({ conversation: { ...conversation, lastMessageAt: conversation.lastMessageAt.toISOString(), createdAt: conversation.createdAt.toISOString(), updatedAt: conversation.updatedAt.toISOString() }, messages: messages.map(serializeMessage) });
  });

  socket.on("admin:join", async (callback) => {
    if (role !== "admin") return callback?.({ error: "Forbidden" });
    callback?.({ conversations: await allSummaries() });
  });

  socket.on("admin:join-conversation", async (conversationId, callback) => {
    if (role !== "admin" || typeof conversationId !== "string") return callback?.({ error: "Forbidden" });
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return callback?.({ error: "Conversation not found" });
    const messages = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
    socket.join(room(conversationId));
    await prisma.message.updateMany({ where: { conversationId, senderRole: "visitor", readByAdmin: false }, data: { readByAdmin: true } });
    callback?.({ conversation: { ...conversation, lastMessageAt: conversation.lastMessageAt.toISOString(), createdAt: conversation.createdAt.toISOString(), updatedAt: conversation.updatedAt.toISOString() }, messages: messages.map(serializeMessage) });
    io.emit("inbox:update", await allSummaries());
  });

  socket.on("chat:send-message", async (payload = {}, callback) => {
    const content = contentOf(payload.content);
    if (!content) return callback?.({ error: "Message must contain 1-2000 characters." });
    let conversation;
    if (role === "visitor") {
      conversation = await getConversation(socket.data.visitorId, typeof payload.visitorName === "string" ? payload.visitorName : undefined);
      if (payload.conversationId !== conversation.id) return callback?.({ error: "Invalid conversation" });
    } else {
      if (typeof payload.conversationId !== "string") return callback?.({ error: "Conversation required" });
      conversation = await prisma.conversation.findUnique({ where: { id: payload.conversationId } });
      if (!conversation) return callback?.({ error: "Conversation not found" });
    }
    const senderRole = role === "admin" ? "admin" : "visitor";
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({ data: { conversationId: conversation.id, senderRole, content, readByAdmin: senderRole === "admin", readByVisitor: senderRole === "visitor" } });
      await tx.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: created.createdAt, status: "open" } });
      return created;
    });
    io.to(room(conversation.id)).emit("chat:message", serializeMessage(message));
    io.emit("inbox:update", await allSummaries());
    if (senderRole === "visitor" && adminSockets.size === 0) await sendPush(conversation.id, conversation.visitorName || `Visitor #${conversation.visitorId.slice(-4)}`, content);
    callback?.({ message: serializeMessage(message) });
  });

  socket.on("chat:typing", (conversationId) => { if (typeof conversationId === "string") socket.to(room(conversationId)).emit("chat:typing", { role, isTyping: true }); });
  socket.on("chat:stop-typing", (conversationId) => { if (typeof conversationId === "string") socket.to(room(conversationId)).emit("chat:typing", { role, isTyping: false }); });
  socket.on("chat:mark-read", async (conversationId) => {
    if (typeof conversationId !== "string") return;
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || (role === "visitor" && conversation.visitorId !== socket.data.visitorId)) return;
    await prisma.message.updateMany({ where: { conversationId, senderRole: role === "admin" ? "visitor" : "admin" }, data: role === "admin" ? { readByAdmin: true } : { readByVisitor: true } });
    io.emit("inbox:update", await allSummaries());
  });
  socket.on("admin:set-status", async (payload, callback) => {
    if (role !== "admin" || typeof payload?.conversationId !== "string" || !["open", "closed"].includes(payload.status)) return callback?.({ error: "Forbidden" });
    await prisma.conversation.update({ where: { id: payload.conversationId }, data: { status: payload.status } });
    io.emit("inbox:update", await allSummaries());
    callback?.({ ok: true });
  });
  socket.on("disconnect", () => { if (role === "admin") adminSockets.delete(socket.id); });
});

httpServer.listen(port, () => console.log(`> Live chat server ready at http://${hostname}:${port}`));
