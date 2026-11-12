import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import type { Role } from "./constants";
import type { Viewer } from "./rbac";
import { roleToLevel } from "./rbac";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type SessionUser } from "./session";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Session straight from the signed cookie. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Session reduced to what the RBAC helpers need. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await getSession();
  if (!session) return null;
  return { id: session.id, role: session.role, level: roleToLevel(session.role) };
}

/** Fresh user row from the database (catches deactivated accounts). */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, department: true, active: true, createdAt: true },
  });
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser(nextPath?: string) {
  const session = await getSession();
  if (!session) {
    redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  }
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?error=inactive");
  }
  return user;
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
}
