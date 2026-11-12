import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError, parseJson, requireViewer } from "@/lib/http";
import { canManageUsers } from "@/lib/rbac";
import { updateUserSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    if (!canManageUsers(viewer.role)) throw new HttpError(403, "Admins only");

    const { id } = await params;
    const body = await parseJson(request, updateUserSchema);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, "User not found");

    // Guard rails: never lock the last admin out of the system.
    if (target.role === "ADMIN" && (body.role && body.role !== "ADMIN" ? true : body.active === false)) {
      const admins = await prisma.user.count({ where: { role: "ADMIN", active: true } });
      if (admins <= 1) throw new HttpError(409, "At least one active administrator must remain");
    }
    if (id === viewer.id && body.active === false) throw new HttpError(409, "You cannot deactivate your own account");

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.role ? { role: body.role } : {}),
        ...(body.department !== undefined ? { department: body.department || null } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.password ? { passwordHash: await hashPassword(body.password) } : {}),
      },
      select: { id: true, name: true, email: true, role: true, active: true, department: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
