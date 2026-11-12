import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/http";
import { ROLES, type Role } from "@/lib/constants";

const DEMO_ACCOUNTS: Record<Role, string> = {
  USER: "user@demo.test",
  L1: "l1@demo.test",
  L2: "l2@demo.test",
  L3: "l3@demo.test",
  ADMIN: "admin@demo.test",
};

/**
 * One-click demo sign-in. Only ever swaps the session to a seeded @demo.test
 * account, so it cannot be used to enter an arbitrary account.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { role?: string };
    const role = (body.role ?? "USER").toUpperCase() as Role;
    if (!ROLES.includes(role)) throw new HttpError(422, "Unknown role");

    const email = DEMO_ACCOUNTS[role];
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    if (!user || !user.active) {
      throw new HttpError(503, "Demo data is not seeded on this deployment yet. Run `npm run db:seed`.");
    }

    await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role as Role });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    return errorResponse(error);
  }
}
