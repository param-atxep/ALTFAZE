import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { BCRYPT_SALT_ROUNDS, OTP_EXPIRY_MINUTES, RESET_TOKEN_EXPIRY_MINUTES } from "@/lib/auth-constants";
import { AuthError } from "@/lib/auth-errors";
import { db } from "@/lib/db";
import { attachAuthCookie, createAuthToken } from "@/lib/auth-session";
import { generateOtp, generateSecureToken, hashToken, normalizeEmail, safeCompareHashes } from "@/lib/auth-crypto";
import { sendOtpEmail, sendPasswordResetEmail } from "@/lib/auth-email";

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function getAppOrigin(fallbackOrigin?: string) {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? fallbackOrigin ?? "http://localhost:3000";
}

export async function issueOtp(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const otp = generateOtp();
  const otpHash = hashToken(otp);

  const user = await db.user.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      role: "CLIENT",
      otp: otpHash,
      otpExpiry: minutesFromNow(OTP_EXPIRY_MINUTES),
      resetToken: null,
      resetExpiry: null,
    },
    update: {
      otp: otpHash,
      otpExpiry: minutesFromNow(OTP_EXPIRY_MINUTES),
      resetToken: null,
      resetExpiry: null,
    },
  });

  await sendOtpEmail(user.email ?? normalizedEmail, otp);

  return { email: normalizedEmail };
}

export async function verifyOtpAndCreateSession(email: string, otp: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });

  if (!user?.otp || !user.otpExpiry) {
    throw new AuthError("OTP is invalid or has expired", 400);
  }

  if (user.otpExpiry.getTime() < Date.now()) {
    throw new AuthError("OTP is invalid or has expired", 400);
  }

  const providedOtpHash = hashToken(otp);

  if (!safeCompareHashes(user.otp, providedOtpHash)) {
    throw new AuthError("OTP is invalid or has expired", 400);
  }

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: {
      otp: null,
      otpExpiry: null,
      emailVerified: user.emailVerified ?? new Date(),
    },
  });

  const token = await createAuthToken({
    id: updatedUser.id,
    email: updatedUser.email ?? normalizedEmail,
    role: updatedUser.role,
    name: updatedUser.name,
    image: updatedUser.image,
  });

  const response = NextResponse.json({
    success: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
    },
  });

  return attachAuthCookie(response, token);
}

export async function sendPasswordResetLink(email: string, origin?: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const appOrigin = getAppOrigin(origin);
    const resetUrl = new URL("/reset-password", appOrigin);

    resetUrl.searchParams.set("token", rawToken);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetExpiry: minutesFromNow(RESET_TOKEN_EXPIRY_MINUTES),
      },
    });

    await sendPasswordResetEmail(user.email ?? normalizedEmail, resetUrl.toString());
  }

  return { success: true };
}

export async function resetPasswordWithToken(token: string, password: string) {
  const tokenHash = hashToken(token);
  const user = await db.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new AuthError("Reset token is invalid or has expired", 400);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetExpiry: null,
      otp: null,
      otpExpiry: null,
    },
  });

  return { success: true };
}