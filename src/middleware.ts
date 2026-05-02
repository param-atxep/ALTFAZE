import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    const url = req.nextUrl.pathname;
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
    });

    // Protect /admin and sub-routes - only ADMIN role
    if (url.startsWith("/admin")) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        if ((token as { role?: string }).role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    // Protect /dashboard and sub-routes
    if (!token && url.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Redirect authenticated users away from auth routes
    if (token && (
        url.startsWith("/login") ||
        url.startsWith("/verify-otp") ||
        url.startsWith("/forgot-password") ||
        url.startsWith("/reset-password") ||
        url.startsWith("/auth/sign-in") ||
        url.startsWith("/auth/sign-up")
    )) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!.*\\..*|_next).*)",
        "/(api|trpc)(.*)",
        "/dashboard(.*)",
        "/admin(.*)",
        "/",
        "/login",
        "/verify-otp",
        "/forgot-password",
        "/reset-password",
        "/auth/sign-in",
        "/auth/sign-up",
    ],
};