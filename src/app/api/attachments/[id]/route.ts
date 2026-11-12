import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse, HttpError, requireViewer } from "@/lib/http";
import { canView } from "@/lib/rbac";

/** Streams an attachment back, but only to people who can see the complaint. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        complaint: { select: { id: true, raisedById: true, assigneeId: true, level: true, status: true } },
      },
    });
    if (!attachment) throw new HttpError(404, "Attachment not found");
    if (!canView(viewer, attachment.complaint)) throw new HttpError(404, "Attachment not found");

    const body = Buffer.from(attachment.data);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `inline; filename="${attachment.filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
