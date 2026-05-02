"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderIcon } from "lucide-react";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from "sonner";
import { Label } from "../ui/label";

const SignInForm = () => {

    const router = useRouter();

    const [email, setEmail] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Email is required!");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Failed to send OTP");
            } else {
                toast.success("OTP sent successfully");
                router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
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
                Sign in to ALTFaze
            </h2>

            <form onSubmit={handleSignIn} className="w-full">
                <div className="space-y-2 w-full">
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
                <div className="mt-4 w-full">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : "Send verification code"}
                    </Button>
                </div>
            </form>
        </div>
    )
};

export default SignInForm
