import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertVisible } from "@/lib/complaints";
import { errorResponse, requireViewer } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    await assertVisible(viewer, id);

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        raisedBy: { select: { id: true, name: true, email: true, department: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
        remarks: {
          where: viewer.role === "USER" ? { internal: false } : {},
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          select: { id: true, filename: true, mimeType: true, size: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ complaint });
  } catch (error) {
    return errorResponse(error);
  }
}
