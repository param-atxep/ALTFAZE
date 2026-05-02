"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authEmailSchema } from "@/lib/auth-schemas";

const loginFormSchema = authEmailSchema;

export function LoginForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error ?? "Failed to send OTP");
      return;
    }

    toast.success("OTP sent to your inbox");
    router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            className="h-12 pl-10"
            {...form.register("email")}
            disabled={form.formState.isSubmitting}
          />
        </div>
        {form.formState.errors.email ? (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <Button type="submit" className="h-12 w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Send OTP
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}