"use client";

import { Button } from "@/components/ui/button";
import { useStartChat } from "@/lib/hooks/use-start-chat";
import { MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";

interface StartChatButtonProps {
  userId: string;
  projectId?: string;
  orderId?: string;
  className?: string;
}

export function StartChatButton({
  userId,
  projectId,
  orderId,
  className,
}: StartChatButtonProps) {
  const { startChat } = useStartChat();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartChat = async () => {
    setIsLoading(true);
    try {
      await startChat(userId, projectId, orderId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleStartChat}
      disabled={isLoading}
      className={className}
      variant="primary"
      size="sm"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <MessageSquare className="h-4 w-4 mr-2" />
      )}
      {isLoading ? "Starting..." : "Message"}
    </Button>
  );
}
