"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket-client";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  projectId?: string;
  messages: any[];
}

interface ConversationListProps {
  onSelectConversation?: (conversationId: string) => void;
  selectedConversationId?: string;
}

export function ConversationList({
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch("/api/chat/conversations");
        const data = await response.json();
        setConversations(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading conversations:", error);
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("message:new", ({ conversationId, text }: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, lastMessage: text, lastMessageAt: new Date().toISOString() }
            : conv
        )
      );
    });

    return () => {
      socket.off("message:new");
    };
  }, [socket, isConnected]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        No conversations yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => {
          const otherParticipant = conversation.participantIds.find(
            (id) => id !== session?.user?.id
          );

          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation?.(conversation.id)}
              className={cn(
                "p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition",
                selectedConversationId === conversation.id && "bg-blue-50"
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {otherParticipant?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {userNames[otherParticipant!] || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {conversation.lastMessage || "No messages yet"}
                  </p>
                  {conversation.lastMessageAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
