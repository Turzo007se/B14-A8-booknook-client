import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { newPassword?: unknown };
    if (typeof body.newPassword !== "string" || body.newPassword.length < 8 || !/[A-Z]/.test(body.newPassword) || !/[a-z]/.test(body.newPassword)) {
      return Response.json({ message: "Use at least 8 characters, including an uppercase and a lowercase letter." }, { status: 400 });
    }
    await auth.api.setPassword({ body: { newPassword: body.newPassword }, headers: await headers() });
    return Response.json({ success: true });
  } catch (error) {
    const status = error instanceof APIError ? error.statusCode : 400;
    const message = error instanceof Error ? error.message : "Couldn't set your password.";
    return Response.json({ message }, { status });
  }
}
