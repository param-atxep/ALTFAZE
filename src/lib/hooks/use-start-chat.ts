"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export function useStartChat() {
  const router = useRouter();
  const { data: session } = useSession();

  const startChat = async (userId: string, projectId?: string, orderId?: string) => {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }

    try {
      // Create or get conversation
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantIds: [userId],
          projectId,
          orderId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const conversation = await response.json();

      // Navigate to chat
      router.push(`/chat?conversationId=${conversation.id}`);
    } catch (error) {
      toast.error("Failed to start chat. Please try again.");
    }
  };

  return { startChat };
}
