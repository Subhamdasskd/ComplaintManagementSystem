import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getViewer } from "./auth";
import type { Viewer } from "./rbac";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new HttpError(422, first?.message ?? "Invalid input", result.error.flatten());
  }
  return result.data;
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new HttpError(401, "You need to sign in first");
  return viewer;
}

/** Converts thrown errors into a JSON response. */
export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return fail(error.status, error.message, error.details);
  }
  if (error instanceof ZodError) {
    return fail(422, error.issues[0]?.message ?? "Invalid input", error.flatten());
  }
  console.error("[api] unhandled error", error);
  const message = error instanceof Error ? error.message : "Unexpected server error";
  return fail(500, message);
}
