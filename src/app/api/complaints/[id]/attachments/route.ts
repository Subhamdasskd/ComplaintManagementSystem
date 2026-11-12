import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertVisible } from "@/lib/complaints";
import { errorResponse, HttpError, requireViewer } from "@/lib/http";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

/** Adds one more attachment to an existing complaint. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    await assertVisible(viewer, id);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new HttpError(422, "Choose a file to upload");
    if (file.size > MAX_FILE_SIZE) throw new HttpError(413, "Files must be 2 MB or smaller");

    const attachment = await prisma.attachment.create({
      data: {
        complaintId: id,
        filename: file.name.slice(0, 180),
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        data: new Uint8Array(Buffer.from(await file.arrayBuffer())),
        uploadedById: viewer.id,
      },
      select: { id: true, filename: true, mimeType: true, size: true },
    });

    await prisma.statusEvent.create({
      data: {
        complaintId: id,
        actorId: viewer.id,
        type: "REMARK",
        toValue: "ATTACHMENT",
        note: `Uploaded ${attachment.filename}`,
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
