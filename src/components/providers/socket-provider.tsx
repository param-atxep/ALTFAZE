"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Initialize socket connection when session is available
    const initializeSocket = async () => {
      try {
        // This will trigger the socket connection through the useSocket hook
        // The actual socket initialization happens in lib/socket-client.ts
        console.log("Socket provider initialized");
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };

    initializeSocket();
  }, [session?.user?.id]);

  return <>{children}</>;
}
