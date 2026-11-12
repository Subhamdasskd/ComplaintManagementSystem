import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError, parseJson, requireViewer } from "@/lib/http";
import { canManageUsers } from "@/lib/rbac";
import { createUserSchema } from "@/lib/validation";

export async function GET() {
  try {
    const viewer = await requireViewer();
    if (!canManageUsers(viewer.role)) throw new HttpError(403, "Admins only");

    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        active: true,
        createdAt: true,
        _count: { select: { assignedComplaints: true, raisedComplaints: true } },
      },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    if (!canManageUsers(viewer.role)) throw new HttpError(403, "Admins only");

    const body = await parseJson(request, createUserSchema);
    const email = body.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "A user with that email already exists");

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        passwordHash: await hashPassword(body.password),
        role: body.role,
        department: body.department || null,
      },
      select: { id: true, name: true, email: true, role: true, department: true, active: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
