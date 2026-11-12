import { NextResponse } from "next/server";
import { escalateAsViewer } from "@/lib/complaints";
import { errorResponse, parseJson, requireViewer } from "@/lib/http";
import { escalateSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const body = await parseJson(request, escalateSchema);
    const result = await escalateAsViewer(viewer, id, body.note);
    return NextResponse.json({ result });
  } catch (error) {
    return errorResponse(error);
  }
}
