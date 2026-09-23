import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const ADMIN_SESSION_COOKIE = "adnan_admin_session";

function secretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return null;
  return admin;
}

export async function createAdminSession(adminId: string) {
  return new SignJWT({ role: "admin", adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function getAdminFromToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.role !== "admin" || typeof payload.adminId !== "string") return null;
    return prisma.admin.findUnique({ where: { id: payload.adminId } });
  } catch {
    return null;
  }
}

export async function getAdmin() {
  const cookieStore = await cookies();
  return getAdminFromToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function hashAdminPassword(password: string) {
  return bcrypt.hash(password, 12);
}
