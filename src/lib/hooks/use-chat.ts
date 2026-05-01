// Chat system utility hooks

"use client";

import { useCallback, useState } from "react";
import { useSocket } from "@/lib/socket-client";
import { useSession } from "next-auth/react";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderImage?: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  projectId?: string;
  orderId?: string;
  messages?: ChatMessage[];
}

// Hook for managing a single conversation
export function useConversation(conversationId: string) {
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`);
      const data = await response.json();
      setMessages(data.messages || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading messages:", error);
      setIsLoading(false);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback(
    async (text: string, fileUrl?: string, fileName?: string) => {
      if (!socket || !isConnected || !text.trim()) return;

      socket.emit("message:send", {
        conversationId,
        text,
        fileUrl,
        fileName,
      });
    },
    [socket, isConnected, conversationId]
  );

  // Mark as read
  const markAsRead = useCallback(
    (messageId: string) => {
      if (!socket) return;
      socket.emit("message:read", messageId);
    },
    [socket]
  );

  return {
    messages,
    isLoading,
    typingUsers,
    sendMessage,
    markAsRead,
    loadMessages,
  };
}

// Hook for managing conversations list
export function useConversations() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/conversations");
      const data = await response.json();
      setConversations(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setIsLoading(false);
    }
  }, []);

  return {
    conversations,
    isLoading,
    loadConversations,
  };
}

// Hook for managing notifications
export function useNotifications() {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/notifications");
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await fetch(`/api/chat/notifications/${notificationId}`, {
          method: "PATCH",
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    []
  );

  return {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
  };
}

// Hook for online status
export function useOnlineStatus(userId: string) {
  const { socket, isConnected } = useSocket();
  const [isOnline, setIsOnline] = useState(false);

  return {
    isOnline,
  };
}
