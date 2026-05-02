"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordFormSchema } from "@/lib/auth-schemas";

type ResetPasswordFormProps = {
  token?: string;
};

export function ResetPasswordForm({ token = "" }: ResetPasswordFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof resetPasswordFormSchema>>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: values.token,
        password: values.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error ?? "Failed to reset password");
      return;
    }

    toast.success("Password updated successfully");
    router.push("/login?reset=success");
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" {...form.register("token")} />

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="password" type="password" autoComplete="new-password" className="h-12 pl-10" {...form.register("password")} disabled={form.formState.isSubmitting} />
        </div>
        {form.formState.errors.password ? (
          <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="confirmPassword" type="password" autoComplete="new-password" className="h-12 pl-10" {...form.register("confirmPassword")} disabled={form.formState.isSubmitting} />
        </div>
        {form.formState.errors.confirmPassword ? (
          <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting || !token}>
        {form.formState.isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Update password
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}