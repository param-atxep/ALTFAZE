import type { NextAuthOptions } from "next-auth";

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7,
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = "role" in user ? user.role : "CLIENT";
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }

      if (trigger === "update" && session?.user?.role) {
        token.role = session.user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? "";
        session.user.role = (token.role ?? "CLIENT") as "CLIENT" | "FREELANCER" | "ADMIN";
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image = token.image ?? session.user.image;
      }

      return session;
    },
  },
} satisfies NextAuthOptions;
