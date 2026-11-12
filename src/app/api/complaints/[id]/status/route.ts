import { NextResponse } from "next/server";
import { changeStatus } from "@/lib/complaints";
import { errorResponse, parseJson, requireViewer } from "@/lib/http";
import { statusChangeSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const body = await parseJson(request, statusChangeSchema);
    const complaint = await changeStatus(viewer, id, body.status, body.note);
    return NextResponse.json({ complaint: { id: complaint.id, status: complaint.status } });
  } catch (error) {
    return errorResponse(error);
  }
}
