import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import { auth } from "@/lib/auth";

type VerifyOtpPageProps = {
  searchParams?: {
    email?: string;
  };
};

export default async function VerifyOtpPage({ searchParams }: VerifyOtpPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Enter the code we emailed you"
      description="Type the six digit code from your inbox. The code expires after 5 minutes."
    >
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Verification</p>
        <h2 className="text-2xl font-semibold text-slate-900">Confirm your email</h2>
      </div>
      <VerifyOtpForm defaultEmail={searchParams?.email} />
    </AuthShell>
  );
}