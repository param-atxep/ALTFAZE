"use server";

import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const SignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CLIENT", "FREELANCER"]).default("CLIENT"),
});

export async function signUpAction(formData: z.infer<typeof SignUpSchema>) {
  const validatedData = SignUpSchema.parse(formData);

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: validatedData.email },
  });

  if (existingUser) {
    return { error: "Email already registered" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  // Create user
  const user = await db.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
    },
  });

  // Create profile
  await db.profile.create({
    data: {
      userId: user.id,
    },
  });

  // Create wallet
  await db.wallet.create({
    data: {
      userId: user.id,
    },
  });

  return { success: true, userId: user.id };
}

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function signInAction(
  formData: z.infer<typeof SignInSchema>
) {
  const validatedData = SignInSchema.parse(formData);

  try {
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    return { error: "Invalid email or password" };
  }
}

export async function setUserRole(role: "CLIENT" | "FREELANCER") {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    return { error: "Failed to set role" };
  }
}
