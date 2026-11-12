import { NextResponse } from "next/server";
import { assignComplaint } from "@/lib/complaints";
import { errorResponse, parseJson, requireViewer } from "@/lib/http";
import { assignSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const body = await parseJson(request, assignSchema);
    const complaint = await assignComplaint(viewer, id, body.assigneeId, body.note);
    return NextResponse.json({ complaint: { id: complaint.id, assigneeId: complaint.assigneeId } });
  } catch (error) {
    return errorResponse(error);
  }
}
