import { NextResponse } from "next/server";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError, parseJson } from "@/lib/http";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, registerSchema);
    const email = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "An account with that email already exists");

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        passwordHash: await hashPassword(body.password),
        role: "USER",
        department: body.department || null,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await setSessionCookie({ ...user, role: "USER" });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
