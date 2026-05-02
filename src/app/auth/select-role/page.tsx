"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { setUserRole } from "@/actions/auth";

export default function SelectRolePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [selectedRole, setSelectedRole] = useState<"CLIENT" | "FREELANCER" | null>(null);
  const [loading, setLoading] = useState(false);

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
          <p className="text-muted-foreground">Please sign in first</p>
        </div>
      </div>
    );
  }

  // If user already has a role, redirect to dashboard
  if (session?.user?.role && session.user.role !== "CLIENT") {
    router.push("/dashboard");
    return null;
  }

  const handleSelectRole = async (role: "CLIENT" | "FREELANCER") => {
    setLoading(true);
    try {
      const result = await setUserRole(role);
      
      if ("error" in result) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      // Update session
      await update();
      toast.success(`Welcome as ${role === "CLIENT" ? "Client" : "Freelancer"}!`);
      
      // Redirect based on role
      if (role === "FREELANCER") {
        router.push("/freelancer/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Failed to set role");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to ALTFaze</h1>
          <p className="text-lg text-muted-foreground mb-2">
            Choose how you want to use our platform
          </p>
          <p className="text-sm text-muted-foreground">
            You can change this later in your settings
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Client Card */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedRole === "CLIENT"
                ? "ring-2 ring-blue-500 shadow-lg"
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedRole("CLIENT")}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <Briefcase className="w-10 h-10 text-blue-500" />
                {selectedRole === "CLIENT" && (
                  <CheckCircle2 className="w-6 h-6 text-blue-500" />
                )}
              </div>
                <CardTitle>I&apos;m a Client</CardTitle>
              <CardDescription>Hire talented freelancers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold mt-1">•</span>
                  <span className="text-sm">Post projects and get proposals from freelancers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold mt-1">•</span>
                  <span className="text-sm">Browse our marketplace of templates and services</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold mt-1">•</span>
                  <span className="text-sm">Secure payments with escrow protection</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold mt-1">•</span>
                  <span className="text-sm">Real-time communication with freelancers</span>
                </li>
              </ul>
              <Button
                className="w-full mt-6"
                  variant={selectedRole === "CLIENT" ? "primary" : "outline"}
                onClick={() => handleSelectRole("CLIENT")}
                disabled={loading}
              >
                {loading && selectedRole === "CLIENT" ? "Setting up..." : "Continue as Client"}
              </Button>
            </CardContent>
          </Card>

          {/* Freelancer Card */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedRole === "FREELANCER"
                ? "ring-2 ring-green-500 shadow-lg"
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedRole("FREELANCER")}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-10 h-10 text-green-500" />
                {selectedRole === "FREELANCER" && (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
              </div>
                <CardTitle>I&apos;m a Freelancer</CardTitle>
              <CardDescription>Earn by providing services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-1">•</span>
                  <span className="text-sm">Browse and bid on exciting projects</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-1">•</span>
                  <span className="text-sm">Sell your templates and services</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-1">•</span>
                  <span className="text-sm">Track earnings and withdrawals</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-1">•</span>
                  <span className="text-sm">Build your portfolio and reputation</span>
                </li>
              </ul>
              <Button
                className="w-full mt-6"
                  variant={selectedRole === "FREELANCER" ? "primary" : "outline"}
                onClick={() => handleSelectRole("FREELANCER")}
                disabled={loading}
              >
                {loading && selectedRole === "FREELANCER"
                  ? "Setting up..."
                  : "Continue as Freelancer"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="mt-12 text-center text-xs text-muted-foreground">
          <p>Both roles give you access to the full platform experience</p>
        </div>
      </div>
    </div>
  );
}
