import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, requireViewer } from "@/lib/http";

export async function GET() {
  try {
    const viewer = await requireViewer();
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: viewer.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({ where: { userId: viewer.id, read: false } }),
    ]);
    return NextResponse.json({ items, unreadCount });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Marks one notification (id in body) or everything as read. */
export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const body = (await request.json().catch(() => ({}))) as { id?: string };
    if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: viewer.id },
        data: { read: true },
      });
    } else {
      await prisma.notification.updateMany({ where: { userId: viewer.id, read: false }, data: { read: true } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
