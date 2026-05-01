"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/lib/socket-client";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, FileIcon, X } from "lucide-react";
import Image from "next/image";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  senderImage?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  isRead: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  participantIds: string[];
}

export function ChatWindow({ conversationId, participantIds }: ChatWindowProps) {
  const { socket, isConnected } = useSocket();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(
          `/api/chat/conversations/${conversationId}`
        );
        const data = await response.json();
        setMessages(data.messages);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading messages:", error);
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join conversation
    socket.emit("conversation:join", conversationId);

    // Listen for new messages
    socket.on("message:new", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();

      // Mark as read if from other user
      if (message.senderId !== session?.user?.id) {
        socket.emit("message:read", message.id);
      }
    });

    // Listen for typing indicators
    socket.on("typing:active", ({ userId }: { userId: string }) => {
      if (userId !== session?.user?.id) {
        setTypingUsers((prev) => [...new Set([...prev, userId])]);
      }
    });

    socket.on("typing:stopped", ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.emit("conversation:leave", conversationId);
      socket.off("message:new");
      socket.off("typing:active");
      socket.off("typing:stopped");
    };
  }, [socket, isConnected, conversationId, session?.user?.id]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  // Typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (socket && isConnected) {
      socket.emit("typing:start", conversationId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", conversationId);
      }, 2000);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() && !selectedFile) return;
    if (!socket || !isConnected) return;

    setIsSending(true);

    try {
      let fileUrl = undefined;
      let fileName = undefined;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          fileUrl = data.url;
          fileName = selectedFile.name;
        }
      }

      socket.emit("message:send", {
        conversationId,
        text: inputValue,
        fileUrl,
        fileName,
      });

      setInputValue("");
      setSelectedFile(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("typing:stop", conversationId);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === session?.user?.id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-sm px-4 py-2 rounded-lg ${
                  message.senderId === session?.user?.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.senderId !== session?.user?.id && (
                  <p className="text-xs font-semibold mb-1">
                    {message.senderName}
                  </p>
                )}
                <p className="break-words">{message.text}</p>
                {message.fileUrl && (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mt-2 text-xs underline"
                  >
                    <FileIcon className="h-4 w-4" />
                    {message.fileName}
                  </a>
                )}
                <p className="text-xs mt-1 opacity-70">
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex gap-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* File preview */}
      {selectedFile && (
        <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FileIcon className="h-4 w-4" />
            {selectedFile.name}
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isSending}
          />
          <div className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <FileIcon className="h-5 w-5" />
          </div>
        </label>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={!isConnected || isSending}
        />
        <Button
          type="submit"
          disabled={!isConnected || isSending || (!inputValue.trim() && !selectedFile)}
          size="sm"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
