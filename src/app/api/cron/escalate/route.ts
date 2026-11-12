import { NextResponse } from "next/server";
import { runEscalations } from "@/lib/complaints";
import { errorResponse, HttpError } from "@/lib/http";

/**
 * SLA watchdog. Vercel Cron calls this on a schedule and sends
 * `Authorization: Bearer $CRON_SECRET`; you can also call it by hand with
 * `?secret=` for local testing.
 */
async function handle(request: Request) {
  try {
    const configured = process.env.CRON_SECRET;
    if (configured) {
      const header = request.headers.get("authorization");
      const url = new URL(request.url);
      const supplied = header?.replace(/^Bearer\s+/i, "") || url.searchParams.get("secret");
      if (supplied !== configured) throw new HttpError(401, "Invalid cron secret");
    }

    const result = await runEscalations();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
