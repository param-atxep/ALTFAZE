import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use the reset token from your email to set a new password and regain access to your account."
    >
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Password reset</p>
        <h2 className="text-2xl font-semibold text-slate-900">Update your password</h2>
      </div>
      <ResetPasswordForm token={searchParams?.token} />
    </AuthShell>
  );
}