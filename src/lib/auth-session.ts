import { randomUUID } from "crypto";

import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

import { AUTH_SESSION_MAX_AGE_SECONDS } from "@/lib/auth-constants";

export const authCookieName = process.env.NODE_ENV === "production"
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
};

type AuthSessionPayload = {
  id: string;
  email: string;
  role: "CLIENT" | "FREELANCER" | "ADMIN";
  name?: string | null;
  image?: string | null;
};

function getAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for authentication sessions");
  }

  return secret;
}

export async function createAuthToken(payload: AuthSessionPayload) {
  return encode({
    token: {
      jti: randomUUID(),
      sub: payload.id,
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name ?? undefined,
      image: payload.image ?? undefined,
    },
    secret: getAuthSecret(),
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    salt: authCookieName,
  });
}

export function attachAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(authCookieName, token, authCookieOptions);
  return response;
}
