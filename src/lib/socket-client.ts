"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

let socket: Socket | null = null;

export const useSocket = () => {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Don't reconnect if already connected
    if (socket && socket.connected) {
      socketRef.current = socket;
      return;
    }

    // Initialize socket connection
    socket = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      auth: {
        token: session.user.id,
        userId: session.user.id,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socketRef.current = socket;

    return () => {
      // Don't disconnect - keep connection alive
      // Only cleanup listeners
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
      }
    };
  }, [session?.user?.id]);

  return {
    socket: socketRef.current,
    isConnected,
    isTyping,
  };
};

export const getSocket = () => {
  return socket;
};
