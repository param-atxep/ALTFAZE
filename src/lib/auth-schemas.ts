import { z } from "zod";

export const authEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const otpSchema = authEmailSchema.extend({
  otp: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const forgotPasswordSchema = authEmailSchema;

export const resetPasswordRequestSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const resetPasswordFormSchema = resetPasswordRequestSchema.extend({
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});