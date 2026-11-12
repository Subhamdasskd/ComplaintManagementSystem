import { NextResponse } from "next/server";
import { errorResponse, HttpError, parseJson, requireViewer } from "@/lib/http";
import { canManageSettings } from "@/lib/rbac";
import { getSettings, saveSettings } from "@/lib/settings";
import { settingsSchema } from "@/lib/validation";

export async function GET() {
  try {
    const viewer = await requireViewer();
    if (!canManageSettings(viewer.role)) throw new HttpError(403, "Admins only");
    const settings = await getSettings();
    return NextResponse.json({ settings: settings.raw });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const viewer = await requireViewer();
    if (!canManageSettings(viewer.role)) throw new HttpError(403, "Admins only");

    const body = await parseJson(request, settingsSchema);
    const updates = Object.fromEntries(Object.entries(body).map(([key, value]) => [key, String(value)]));
    await saveSettings(updates);
    return NextResponse.json({ settings: updates });
  } catch (error) {
    return errorResponse(error);
  }
}
