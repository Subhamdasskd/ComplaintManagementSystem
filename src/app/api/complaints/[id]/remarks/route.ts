import { NextResponse } from "next/server";
import { addRemark } from "@/lib/complaints";
import { errorResponse, parseJson, requireViewer } from "@/lib/http";
import { remarkSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    const { id } = await params;
    const body = await parseJson(request, remarkSchema);
    const remark = await addRemark(viewer, id, body.body, Boolean(body.internal));
    return NextResponse.json({ remark }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
