"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/lib/socket-client";

interface OnlineStatusProps {
  userId: string;
}

export function OnlineStatus({ userId }: OnlineStatusProps) {
  const { socket, isConnected } = useSocket();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for user online/offline events
    socket.on("user:online", ({ userId: eventUserId }: { userId: string }) => {
      if (eventUserId === userId) {
        setIsOnline(true);
      }
    });

    socket.on("user:offline", ({ userId: eventUserId }: { userId: string }) => {
      if (eventUserId === userId) {
        setIsOnline(false);
      }
    });

    return () => {
      socket.off("user:online");
      socket.off("user:offline");
    };
  }, [socket, isConnected, userId]);

  return (
    <div
      className={`h-3 w-3 rounded-full ${
        isOnline ? "bg-green-500" : "bg-gray-300"
      }`}
      title={isOnline ? "Online" : "Offline"}
    />
  );
}
