import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    const url = req.nextUrl.pathname;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Protect /admin and sub-routes - only ADMIN role
    if (url.startsWith("/admin")) {
        if (!token) {
            return NextResponse.redirect(new URL("/auth/sign-in", req.url));
        }
        if ((token as { role?: string }).role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    // Protect /dashboard and sub-routes
    if (!token && url.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/auth/sign-in", req.url));
    }

    // Check if user needs to select a role (has just logged in via OAuth or signup)
    if (token && (token as { role?: string }).role === "CLIENT") {
        // Allow role selection page and auth routes for users with CLIENT role (default)
        // who haven't explicitly selected yet
        if (!url.startsWith("/auth") && 
            !url.startsWith("/api") && 
            url.startsWith("/dashboard")) {
            // Could redirect to select-role here, but keep current behavior for now
        }
    }

    // Redirect authenticated users away from auth routes
    if (token && (url.startsWith("/auth/sign-in") || url.startsWith("/auth/sign-up"))) {
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
        "/auth/sign-in",
        "/auth/sign-up",
    ],
};