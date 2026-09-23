import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  if (typeof body?.endpoint !== "string" || typeof body.keys?.p256dh !== "string" || typeof body.keys.auth !== "string") return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { adminId: admin.id, p256dh: body.keys.p256dh, auth: body.keys.auth },
    create: { adminId: admin.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
  });
  return NextResponse.json({ ok: true });
}
