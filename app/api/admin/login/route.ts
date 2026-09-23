import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSession, verifyAdminCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string") return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  const admin = await verifyAdminCredentials(body.email, body.password);
  if (!admin) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(admin.id), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
