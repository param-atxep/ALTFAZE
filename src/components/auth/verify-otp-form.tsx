"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { otpSchema } from "@/lib/auth-schemas";

const verifyOtpSchema = otpSchema;

type VerifyOtpFormProps = {
  defaultEmail?: string;
};

export function VerifyOtpForm({ defaultEmail = "" }: VerifyOtpFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof verifyOtpSchema>>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: defaultEmail, otp: "" },
  });

  const emailValue = form.watch("email");

  const handleSubmit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error ?? "Invalid OTP");
      return;
    }

    toast.success("You are signed in");
    router.replace("/dashboard");
    router.refresh();
  });

  const handleResend = async () => {
    if (!emailValue) {
      toast.error("Enter your email first");
      return;
    }

    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: emailValue }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error ?? "Could not resend OTP");
      return;
    }

    toast.success("OTP resent");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="email" type="email" className="h-12 pl-10" {...form.register("email")} disabled={form.formState.isSubmitting} />
        </div>
        {form.formState.errors.email ? (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp">Verification code</Label>
        <div className="relative">
          <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="otp" inputMode="numeric" maxLength={6} placeholder="123456" className="h-12 pl-10 tracking-[0.45em]" {...form.register("otp")} disabled={form.formState.isSubmitting} />
        </div>
        {form.formState.errors.otp ? (
          <p className="text-sm text-red-600">{form.formState.errors.otp.message}</p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={handleResend} disabled={form.formState.isSubmitting} className="px-0 text-slate-600 hover:text-slate-900">
          Resend code
        </Button>
        <Link href="/forgot-password" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Verify and continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}