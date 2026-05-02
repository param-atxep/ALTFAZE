import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { AuthError } from "@/lib/auth-errors";
import { authEmailSchema } from "@/lib/auth-schemas";
import { issueOtp } from "@/lib/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedBody = authEmailSchema.parse(body);

    await issueOtp(validatedBody.email);

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}