import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Sign in with a secure email code"
      description="We will send a 6 digit code to your inbox. Verify it once to create a session and continue to the dashboard."
      footer={
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Need a password reset?</span>
          <a href="/forgot-password" className="font-medium text-slate-900 hover:underline">Forgot password</a>
        </div>
      }
    >
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Login / signup</p>
        <h2 className="text-2xl font-semibold text-slate-900">Continue with your email</h2>
      </div>
      <LoginForm />
    </AuthShell>
  );
}