import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email address linked to your account and we will send a secure reset link that expires after 15 minutes."
    >
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Password recovery</p>
        <h2 className="text-2xl font-semibold text-slate-900">Send reset link</h2>
      </div>
      <ForgotPasswordForm />
    </AuthShell>
  );
}