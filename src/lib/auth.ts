import NextAuth from "next-auth";
import { getServerSession } from "next-auth/next";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

import "@/lib/next-auth-augmentations";
import { authConfig } from "@/lib/auth.config";

export const authHandler = NextAuth(authConfig);

export async function auth() {
  return getServerSession(authConfig);
}

export const signIn = nextAuthSignIn;
export const signOut = nextAuthSignOut;
