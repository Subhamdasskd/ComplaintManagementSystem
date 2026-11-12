import { NextResponse } from "next/server";
import { addFeedback } from "@/lib/complaints";
import { errorResponse, parseJson, requireViewer } from "@/lib/http";
import { feedbackSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const body = await parseJson(request, feedbackSchema);
    const result = await addFeedback(viewer, id, body.rating, body.feedback);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
