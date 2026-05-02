import { Server as HTTPServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer, Socket } from "socket.io";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

type AuthenticatedSocket = Socket & {
  userId?: string;
  userEmail?: string | null;
};

declare global {
  var io: SocketIOServer | undefined;
}

let io: SocketIOServer;

const initializeSocket = (httpServer: HTTPServer) => {
  if (!io) {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    // Middleware for authentication
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication required"));
        }

        // Verify token (simplified - use your actual auth verification)
        const user = await db.user.findFirst({
          where: { id: (socket as AuthenticatedSocket).handshake.auth.userId },
        });

        if (!user) {
          return next(new Error("User not found"));
        }

        (socket as AuthenticatedSocket).userId = user.id;
        (socket as AuthenticatedSocket).userEmail = user.email;
        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });

    // Connection handler
    io.on("connection", async (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId}`);

      // Set user online
      if (socket.userId) {
        await db.userPresence.upsert({
          where: { userId: socket.userId },
          update: { isOnline: true, lastSeenAt: new Date() },
          create: { userId: socket.userId, isOnline: true },
        });

        // Broadcast user online status
        io.emit("user:online", { userId: socket.userId });
      }

      // Join user room (for personal notifications)
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      // Message send
      socket.on("message:send", async (data: any) => {
        try {
          const { conversationId, text, fileUrl, fileName } = data;

          if (!socket.userId) return;

          // Verify user is participant in conversation
          const conversation = await db.conversation.findUnique({
            where: { id: conversationId },
          });

          if (!conversation?.participantIds.includes(socket.userId)) {
            socket.emit("error", { message: "Not a participant in this conversation" });
            return;
          }

          // Save message to DB
          const message = await db.message.create({
            data: {
              conversationId,
              senderId: socket.userId,
              text,
              fileUrl,
              fileName,
            },
            include: { sender: true },
          });

          // Update conversation
          await db.conversation.update({
            where: { id: conversationId },
            data: {
              lastMessage: text,
              lastMessageAt: new Date(),
            },
          });

          // Emit to all participants
          io.to(`conversation:${conversationId}`).emit("message:new", {
            id: message.id,
            conversationId,
            senderId: message.senderId,
            senderName: message.sender.name,
            senderImage: message.sender.image,
            text: message.text,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            createdAt: message.createdAt,
          });

          // Notify other participants
          const recipients = conversation.participantIds.filter(
            (id) => id !== socket.userId
          );

          for (const recipientId of recipients) {
            io.to(`user:${recipientId}`).emit("notification:new", {
              type: "MESSAGE",
              message: `New message from ${message.sender.name}`,
              conversationId,
              messageId: message.id,
              senderId: socket.userId,
            });
          }
        } catch (error) {
          console.error("Message send error:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // Join conversation room
      socket.on("conversation:join", (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        io.to(`conversation:${conversationId}`).emit("user:typing-stopped", {
          userId: socket.userId,
        });
      });

      // Leave conversation room
      socket.on("conversation:leave", (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
      });

      // Typing indicator
      socket.on("typing:start", (conversationId: string) => {
        io.to(`conversation:${conversationId}`).emit("typing:active", {
          userId: socket.userId,
        });
      });

      socket.on("typing:stop", (conversationId: string) => {
        io.to(`conversation:${conversationId}`).emit("typing:stopped", {
          userId: socket.userId,
        });
      });

      // Mark message as read
      socket.on("message:read", async (messageId: string) => {
        try {
          await db.message.update({
            where: { id: messageId },
            data: { isRead: true, readAt: new Date() },
          });
        } catch (error) {
          console.error("Mark read error:", error);
        }
      });

      // Disconnect handler
      socket.on("disconnect", async () => {
        console.log(`User disconnected: ${socket.userId}`);

        if (socket.userId) {
          // Set user offline
          await db.userPresence.update({
            where: { userId: socket.userId },
            data: { isOnline: false, lastSeenAt: new Date() },
          });

          // Broadcast user offline status
          io.emit("user:offline", { userId: socket.userId });
        }
      });
    });
  }

  return io;
};

export { initializeSocket, SocketIOServer };
