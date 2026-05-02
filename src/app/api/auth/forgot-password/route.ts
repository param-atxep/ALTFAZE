import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { forgotPasswordSchema } from "@/lib/auth-schemas";
import { sendPasswordResetLink } from "@/lib/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedBody = forgotPasswordSchema.parse(body);

    await sendPasswordResetLink(validatedBody.email, new URL(request.url).origin);

    return NextResponse.json({ success: true, message: "If the account exists, a reset link has been sent" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to process password reset request" }, { status: 500 });
  }
}