import { createHash, randomInt, randomBytes, timingSafeEqual } from "crypto";

import { OTP_LENGTH } from "@/lib/auth-constants";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateOtp() {
  const max = 10 ** OTP_LENGTH;
  return randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

export function generateSecureToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeCompareHashes(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}