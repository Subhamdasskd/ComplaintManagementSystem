import { NextResponse } from "next/server";
import { authenticate, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { errorResponse, HttpError, parseJson } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await parseJson(request, loginSchema);
    const user = await authenticate(body.email, body.password);
    if (!user) throw new HttpError(401, "Email or password is incorrect");
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
