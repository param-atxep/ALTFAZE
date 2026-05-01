import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Auto-create conversation when order is accepted
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, projectId, freelancerId } = await req.json();

    if (!orderId && !projectId) {
      return NextResponse.json(
        { error: "Order ID or Project ID required" },
        { status: 400 }
      );
    }

    let conversation = null;

    // Check if conversation already exists
    if (orderId) {
      conversation = await db.conversation.findFirst({
        where: { orderId },
      });
    } else if (projectId) {
      conversation = await db.conversation.findFirst({
        where: { projectId },
      });
    }

    if (conversation) {
      return NextResponse.json(conversation);
    }

    // Create new conversation
    const participants = [session.user.id];
    if (freelancerId) {
      participants.push(freelancerId);
    }

    conversation = await db.conversation.create({
      data: {
        participantIds: Array.from(new Set(participants)),
        orderId: orderId || undefined,
        projectId: projectId || undefined,
      },
    });

    // Create notification for the other party
    const otherUserId = freelancerId || participants[1];
    if (otherUserId && otherUserId !== session.user.id) {
      const notificationType = orderId ? "ORDER_ACCEPTED" : "PROJECT_STARTED";
      const message =
        orderId
          ? "Your order has been accepted. Start chatting about project details."
          : "A new project has started. Connect with the client.";

      await db.notification.create({
        data: {
          userId: otherUserId,
          type: notificationType,
          message,
          actionUrl: `/chat`,
          conversationId: conversation.id,
        },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
