import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { AuthError } from "@/lib/auth-errors";
import { resetPasswordRequestSchema } from "@/lib/auth-schemas";
import { resetPasswordWithToken } from "@/lib/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedBody = resetPasswordRequestSchema.parse(body);

    await resetPasswordWithToken(validatedBody.token, validatedBody.password);

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}