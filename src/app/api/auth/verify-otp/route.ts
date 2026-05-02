import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { AuthError } from "@/lib/auth-errors";
import { otpSchema } from "@/lib/auth-schemas";
import { verifyOtpAndCreateSession } from "@/lib/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedBody = otpSchema.parse(body);

    return await verifyOtpAndCreateSession(validatedBody.email, validatedBody.otp);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}