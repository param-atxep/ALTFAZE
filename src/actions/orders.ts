"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

const CreateOrderSchema = z.object({
  projectId: z.string(),
  freelancerId: z.string(),
  bidAmount: z.number().min(10),
});

const UpdateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(["ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "DISPUTED"]),
});

const DeliverOrderSchema = z.object({
  orderId: z.string(),
  fileUrl: z.string().url(),
  notes: z.string().optional(),
});

export async function createOrder(data: z.infer<typeof CreateOrderSchema>) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = CreateOrderSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid order data" };
  }

  try {
    const project = await db.project.findUnique({
      where: { id: validated.data.projectId },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    if (project.creatorId !== session.user.id) {
      return { error: "Only project owner can create orders" };
    }

    const freelancer = await db.user.findUnique({
      where: { id: validated.data.freelancerId },
    });

    if (!freelancer || freelancer.role !== "FREELANCER") {
      return { error: "Freelancer not found" };
    }

    // Check if order already exists
    const existingOrder = await db.order.findFirst({
      where: { projectId: validated.data.projectId },
    });

    if (existingOrder) {
      return { error: "Order already exists for this project" };
    }

    const order = await db.order.create({
      data: {
        projectId: validated.data.projectId,
        clientId: session.user.id,
        freelancerId: validated.data.freelancerId,
        amount: validated.data.bidAmount,
        status: "ACCEPTED",
        paymentStatus: "PENDING",
        escrowStatus: "HELD",
      },
    });

    // Create notification for freelancer
    await db.notification.create({
      data: {
        userId: validated.data.freelancerId,
        type: "ORDER_ACCEPTED",
        message: `Your proposal for "${project.title}" has been accepted`,
        actionUrl: `/orders/${order.id}`,
      },
    });

    // Update project status
    await db.project.update({
      where: { id: validated.data.projectId },
      data: { status: "IN_PROGRESS" },
    });

    logger.info("Order created", { orderId: order.id, projectId: project.id });

    return { success: true, orderId: order.id };
  } catch (error) {
    logger.error("Create order error", { error: String(error) });
    return { error: "Failed to create order" };
  }
}

export async function updateOrderStatus(data: z.infer<typeof UpdateOrderStatusSchema>) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const validated = UpdateOrderStatusSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid status data" };
  }

  try {
    const order = await db.order.findUnique({
      where: { id: validated.data.orderId },
      include: { project: true },
    });

    if (!order) {
      return { error: "Order not found" };
    }

    // Authorization check
    if (order.clientId !== session.user.id && order.freelancerId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const previousStatus = order.status;
    const updatedOrder = await db.order.update({
      where: { id: validated.data.orderId },
      data: { status: validated.data.status },
    });

    logger.info("Order status updated", {
      orderId: order.id,
      previousStatus,
      newStatus: validated.data.status,
    });

    return { success: true, order: updatedOrder };
  } catch (error) {
    logger.error("Update order status error", { error: String(error) });
    return { error: "Failed to update order status" };
  }
}

export async function completeOrder(orderId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { error: "Order not found" };
    }

    if (order.clientId !== session.user.id) {
      return { error: "Only client can mark order as completed" };
    }

    // Release escrow to freelancer
    const freelancerWallet = await db.wallet.findUnique({
      where: { userId: order.freelancerId! },
    });

    if (freelancerWallet) {
      await db.wallet.update({
        where: { userId: order.freelancerId! },
        data: { balance: { increment: order.amount } },
      });
    } else {
      await db.wallet.create({
        data: {
          userId: order.freelancerId!,
          balance: order.amount,
        },
      });
    }

    const completedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED",
        paymentStatus: "SUCCEEDED",
        escrowStatus: "RELEASED",
      },
    });

    // Create transaction
    await db.transaction.create({
      data: {
        userId: order.freelancerId!,
        type: "CREDIT",
        amount: order.amount,
        description: `Order ${orderId} completed - Payment released`,
        referenceId: orderId,
        status: "SUCCEEDED",
      },
    });

    // Notification
    await db.notification.create({
      data: {
        userId: order.freelancerId!,
        type: "ORDER_COMPLETED",
        message: `Order ${orderId} completed. Funds released to your wallet.`,
        actionUrl: `/orders/${orderId}`,
      },
    });

    logger.info("Order completed", { orderId });

    return { success: true, order: completedOrder };
  } catch (error) {
    logger.error("Complete order error", { error: String(error) });
    return { error: "Failed to complete order" };
  }
}

export async function disputeOrder(orderId: string, reason: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!reason || reason.length < 10) {
    return { error: "Dispute reason must be at least 10 characters" };
  }

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { error: "Order not found" };
    }

    if (order.clientId !== session.user.id && order.freelancerId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const disputedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: "DISPUTED",
      },
    });

    // Create admin notification
    await db.adminNotification.create({
      data: {
        type: "ORDER_DISPUTE",
        title: `Order ${orderId} Disputed`,
        message: `Dispute reason: ${reason}`,
        priority: "high",
      },
    });

    logger.warn("Order disputed", { orderId, reason, userId: session.user.id });

    return { success: true, order: disputedOrder };
  } catch (error) {
    logger.error("Dispute order error", { error: String(error) });
    return { error: "Failed to dispute order" };
  }
}

export async function getOrderDetails(orderId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        project: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            rating: true,
          },
        },
      },
    });

    if (!order) {
      return { error: "Order not found" };
    }

    if (order.clientId !== session.user.id && order.freelancerId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    return order;
  } catch (error) {
    logger.error("Get order details error", { error: String(error) });
    return { error: "Failed to fetch order" };
  }
}

export async function getUserOrders(role: "CLIENT" | "FREELANCER" = "CLIENT") {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const orders = await db.order.findMany({
      where: role === "CLIENT" ? { clientId: session.user.id } : { freelancerId: session.user.id },
      include: { project: true, client: true },
      orderBy: { createdAt: "desc" },
    });

    return orders;
  } catch (error) {
    logger.error("Get user orders error", { error: String(error) });
    return { error: "Failed to fetch orders" };
  }
}
