"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/actions/auth";
import { Eye, EyeOff, LoaderIcon } from "lucide-react";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from "sonner";
import { Label } from "../ui/label";
import { signIn } from "next-auth/react";

type UserRole = "CLIENT" | "FREELANCER";

const SignUpForm = () => {

    const router = useRouter();

    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [role, setRole] = useState<UserRole>("CLIENT");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password) {
            toast.error("Name, email and password are required!");
            return;
        }

        setIsLoading(true);

        try {
            const result = await signUpAction({
                name,
                email,
                password,
                role,
            });

            if (result?.error) {
                toast.error(result.error);
            } else if (result?.success) {
                toast.success("Account created successfully! Signing you in...");
                
                // Auto-sign in the user
                const signInResult = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });

                if (signInResult?.ok) {
                    router.push("/dashboard");
                } else {
                    router.push("/auth/sign-in");
                }
            }
        } catch (error) {
            toast.error("An error occurred. Please try again");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5">
            <h2 className="text-2xl font-semibold">
                Join ALTFaze
            </h2>

            <form onSubmit={handleSignUp} className="w-full">
                <div className="space-y-2 w-full">
                    <Label htmlFor="name">
                        Full Name
                    </Label>
                    <Input
                        id="name"
                        type="text"
                        value={name}
                        disabled={isLoading}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full focus-visible:border-foreground"
                    />
                </div>
                <div className="mt-4 space-y-2 w-full">
                    <Label htmlFor="email">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled={isLoading}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full focus-visible:border-foreground"
                    />
                </div>
                <div className="mt-4 space-y-2">
                    <Label htmlFor="password">
                        Password
                    </Label>
                    <div className="relative w-full">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            disabled={isLoading}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full focus-visible:border-foreground"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute top-1 right-1"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ?
                                <EyeOff className="w-4 h-4" /> :
                                <Eye className="w-4 h-4" />
                            }
                        </Button>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <Label>I want to</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                value="CLIENT"
                                checked={role === "CLIENT"}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                disabled={isLoading}
                            />
                            <span className="text-sm">Hire Freelancers</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                value="FREELANCER"
                                checked={role === "FREELANCER"}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                disabled={isLoading}
                            />
                            <span className="text-sm">Offer Services</span>
                        </label>
                    </div>
                </div>
                <div className="mt-4 w-full">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : "Create Account"}
                    </Button>
                </div>
            </form>
        </div>
    )
};

export default SignUpForm
