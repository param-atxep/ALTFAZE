"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

// ============ TEMPLATE OPERATIONS ============

export async function buyTemplate(templateId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "CLIENT") {
    return { error: "Only clients can buy templates" };
  }

  try {
    const template = await db.template.findUnique({
      where: { id: templateId },
      include: { creator: true },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    // Check if already purchased
    const existingPurchase = await db.templatePurchase.findFirst({
      where: {
        templateId,
        buyerId: session.user.id,
      },
    });

    if (existingPurchase) {
      return { error: "You already own this template" };
    }

    // Get buyer wallet
    const buyerWallet = await db.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!buyerWallet || buyerWallet.balance < template.price) {
      return { error: "Insufficient wallet balance" };
    }

    // Create purchase
    const purchase = await db.templatePurchase.create({
      data: {
        templateId,
        buyerId: session.user.id,
        sellerId: template.creatorId,
        amount: template.price,
        status: "completed",
      },
    });

    // Deduct from buyer wallet
    await db.wallet.update({
      where: { userId: session.user.id },
      data: { balance: { decrement: template.price } },
    });

    // Credit to seller wallet
    await db.wallet.update({
      where: { userId: template.creatorId },
      data: { balance: { increment: template.price } },
    });

    // Create transactions
    await db.transaction.create({
      data: {
        userId: session.user.id,
        type: "PURCHASE",
        amount: template.price,
        description: `Purchased template: ${template.title}`,
      },
    });

    await db.transaction.create({
      data: {
        userId: template.creatorId,
        type: "SALE",
        amount: template.price,
        description: `Sold template: ${template.title}`,
      },
    });

    return { success: true, purchaseId: purchase.id };
  } catch (error) {
    console.error("Buy template error:", error);
    return { error: "Failed to purchase template" };
  }
}

// ============ PROJECT OPERATIONS ============

const PostProjectSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget: z.number().min(10, "Budget must be at least $10"),
  category: z.string().min(1, "Category is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  deadline: z.string().optional(),
});

export async function postProject(data: z.infer<typeof PostProjectSchema>) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "CLIENT") {
    return { error: "Only clients can post projects" };
  }

  const validatedData = PostProjectSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: "Invalid project data" };
  }

  try {
    const project = await db.project.create({
      data: {
        title: validatedData.data.title,
        description: validatedData.data.description,
        budget: validatedData.data.budget,
        category: validatedData.data.category,
        skills: validatedData.data.skills,
        deadline: validatedData.data.deadline ? new Date(validatedData.data.deadline) : null,
        creatorId: session.user.id,
        status: "OPEN",
      },
    });

    return { success: true, projectId: project.id };
  } catch (error) {
    console.error("Post project error:", error);
    return { error: "Failed to post project" };
  }
}

// ============ HIRE FREELANCER ============

const HireFreelancerSchema = z.object({
  freelancerId: z.string(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function hireFreelancer(data: z.infer<typeof HireFreelancerSchema>) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "CLIENT") {
    return { error: "Only clients can send hire requests" };
  }

  const validatedData = HireFreelancerSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: "Invalid hire request data" };
  }

  try {
    const freelancer = await db.user.findUnique({
      where: { id: validatedData.data.freelancerId },
    });

    if (!freelancer || freelancer.role !== "FREELANCER") {
      return { error: "Freelancer not found" };
    }

    // Check for existing pending request
    const existingRequest = await db.hireRequest.findFirst({
      where: {
        clientId: session.user.id,
        freelancerId: validatedData.data.freelancerId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return { error: "You already have a pending request with this freelancer" };
    }

    const hireRequest = await db.hireRequest.create({
      data: {
        clientId: session.user.id,
        freelancerId: validatedData.data.freelancerId,
        message: validatedData.data.message,
        status: "PENDING",
      },
    });

    return { success: true, requestId: hireRequest.id };
  } catch (error) {
    console.error("Hire freelancer error:", error);
    return { error: "Failed to send hire request" };
  }
}

// ============ GET OPERATIONS ============

export async function getClientDashboard() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const wallet = await db.wallet.findUnique({
      where: { userId: session.user.id },
    });

    const projects = await db.project.findMany({
      where: { creatorId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const purchases = await db.templatePurchase.findMany({
      where: { buyerId: session.user.id },
      include: { template: true },
      orderBy: { createdAt: "desc" },
    });

    const transactions = await db.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const orders = await db.order.findMany({
      where: { clientId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      wallet: wallet?.balance || 0,
      projects,
      purchases,
      transactions,
      ordersCount: orders.length,
    };
  } catch (error) {
    console.error("Get dashboard error:", error);
    return { error: "Failed to fetch dashboard data" };
  }
}

export async function getTemplates(
  category?: string,
  minPrice?: number,
  maxPrice?: number,
  search?: string
) {
  try {
    const templates = await db.template.findMany({
      where: {
        ...(category && { category }),
        ...(minPrice !== undefined && { price: { gte: minPrice } }),
        ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: { creator: true },
      orderBy: { createdAt: "desc" },
    });

    return templates;
  } catch (error) {
    console.error("Get templates error:", error);
    return [];
  }
}

export async function getTemplate(id: string) {
  try {
    const template = await db.template.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    return template;
  } catch (error) {
    console.error("Get template error:", error);
    return { error: "Failed to fetch template" };
  }
}

export async function getFreelancers(
  skills?: string[],
  minRating?: number
) {
  try {
    const freelancers = await db.user.findMany({
      where: {
        role: "FREELANCER",
        ...(minRating && { rating: { gte: minRating } }),
        ...(skills && {
          skills: { hasSome: skills },
        }),
      },
      include: { profile: true },
      orderBy: { rating: "desc" },
    });

    return freelancers;
  } catch (error) {
    console.error("Get freelancers error:", error);
    return [];
  }
}

export async function getFreelancer(id: string) {
  try {
    const freelancer = await db.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!freelancer || freelancer.role !== "FREELANCER") {
      return { error: "Freelancer not found" };
    }

    return freelancer;
  } catch (error) {
    console.error("Get freelancer error:", error);
    return { error: "Failed to fetch freelancer" };
  }
}

export async function getUserProjects() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const projects = await db.project.findMany({
      where: { creatorId: session.user.id },
      include: { proposals: true, _count: { select: { proposals: true } } },
      orderBy: { createdAt: "desc" },
    });

    return projects;
  } catch (error) {
    console.error("Get user projects error:", error);
    return [];
  }
}

export async function getUserPurchases() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const purchases = await db.templatePurchase.findMany({
      where: { buyerId: session.user.id },
      include: { template: true, seller: true },
      orderBy: { createdAt: "desc" },
    });

    return purchases;
  } catch (error) {
    console.error("Get user purchases error:", error);
    return [];
  }
}

export async function getUserTransactions() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const transactions = await db.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return transactions;
  } catch (error) {
    console.error("Get user transactions error:", error);
    return [];
  }
}

// ============ FREELANCER OPERATIONS ============

const CreateTemplateSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.number().min(1, "Price must be at least $1"),
  category: z.string().min(1, "Category is required"),
  features: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  fileUrl: z.string().optional(),
});

export async function createTemplate(
  data: z.infer<typeof CreateTemplateSchema>
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "FREELANCER") {
    return { error: "Only freelancers can create templates" };
  }

  const validatedData = CreateTemplateSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: "Invalid template data" };
  }

  try {
    const template = await db.template.create({
      data: {
        title: validatedData.data.title,
        description: validatedData.data.description,
        price: validatedData.data.price,
        category: validatedData.data.category,
        features: validatedData.data.features || [],
        techStack: validatedData.data.techStack || [],
        imageUrl: validatedData.data.imageUrl,
        fileUrl: validatedData.data.fileUrl,
        creatorId: session.user.id,
      },
    });

    return { success: true, templateId: template.id };
  } catch (error) {
    console.error("Create template error:", error);
    return { error: "Failed to create template" };
  }
}

export async function getFreelancerDashboard() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "FREELANCER") {
    return { error: "Only freelancers can access this" };
  }

  try {
    const wallet = await db.wallet.findUnique({
      where: { userId: session.user.id },
    });

    const templates = await db.template.findMany({
      where: { creatorId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { purchases: true } } },
    });

    const templateSales = await db.templatePurchase.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const hireRequests = await db.hireRequest.findMany({
      where: { freelancerId: session.user.id },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    const proposals = await db.proposal.findMany({
      where: { freelancerId: session.user.id },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });

    const earnings = templateSales.reduce((sum, sale) => sum + sale.amount, 0);

    return {
      wallet: wallet?.balance || 0,
      templates,
      templateSales,
      hireRequests,
      proposals,
      earnings,
      templateCount: templates.length,
      totalSales: templateSales.length,
    };
  } catch (error) {
    console.error("Get freelancer dashboard error:", error);
    return { error: "Failed to fetch dashboard data" };
  }
}

export async function getFreelancerTemplates() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "FREELANCER") {
    return { error: "Only freelancers can access this" };
  }

  try {
    const templates = await db.template.findMany({
      where: { creatorId: session.user.id },
      include: { _count: { select: { purchases: true } } },
      orderBy: { createdAt: "desc" },
    });

    return templates;
  } catch (error) {
    console.error("Get freelancer templates error:", error);
    return [];
  }
}

export async function getFreelancerOrders() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "FREELANCER") {
    return { error: "Only freelancers can access this" };
  }

  try {
    const proposals = await db.proposal.findMany({
      where: { freelancerId: session.user.id },
      include: {
        project: { include: { creator: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hireRequests = await db.hireRequest.findMany({
      where: { freelancerId: session.user.id },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    return { proposals, hireRequests };
  } catch (error) {
    console.error("Get freelancer orders error:", error);
    return { proposals: [], hireRequests: [] };
  }
}

export async function acceptHireRequest(requestId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const hireRequest = await db.hireRequest.findUnique({
      where: { id: requestId },
    });

    if (!hireRequest) {
      return { error: "Hire request not found" };
    }

    if (hireRequest.freelancerId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const updated = await db.hireRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });

    return { success: true, request: updated };
  } catch (error) {
    console.error("Accept hire request error:", error);
    return { error: "Failed to accept hire request" };
  }
}

export async function rejectHireRequest(requestId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const hireRequest = await db.hireRequest.findUnique({
      where: { id: requestId },
    });

    if (!hireRequest) {
      return { error: "Hire request not found" };
    }

    if (hireRequest.freelancerId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const updated = await db.hireRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    return { success: true, request: updated };
  } catch (error) {
    console.error("Reject hire request error:", error);
    return { error: "Failed to reject hire request" };
  }
}

// ============ EDIT/DELETE TEMPLATE ============

export async function updateTemplate(
  templateId: string,
  data: z.infer<typeof CreateTemplateSchema>
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const template = await db.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    if (template.creatorId !== session.user.id) {
      return { error: "Only creator can edit template" };
    }

    const validatedData = CreateTemplateSchema.safeParse(data);
    if (!validatedData.success) {
      return { error: "Invalid template data" };
    }

    const updated = await db.template.update({
      where: { id: templateId },
      data: {
        title: validatedData.data.title,
        description: validatedData.data.description,
        price: validatedData.data.price,
        category: validatedData.data.category,
        features: validatedData.data.features || [],
        techStack: validatedData.data.techStack || [],
        imageUrl: validatedData.data.imageUrl,
        fileUrl: validatedData.data.fileUrl,
      },
    });

    return { success: true, template: updated };
  } catch (error) {
    console.error("Update template error:", error);
    return { error: "Failed to update template" };
  }
}

export async function deleteTemplate(templateId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const template = await db.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    if (template.creatorId !== session.user.id) {
      return { error: "Only creator can delete template" };
    }

    // Check if has purchases
    const purchases = await db.templatePurchase.count({
      where: { templateId },
    });

    if (purchases > 0) {
      return { error: "Cannot delete template with existing purchases" };
    }

    await db.template.delete({
      where: { id: templateId },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete template error:", error);
    return { error: "Failed to delete template" };
  }
}

// ============ PROJECT BIDDING ============

const BidProjectSchema = z.object({
  projectId: z.string(),
  bidAmount: z.number().min(1, "Bid amount must be at least $1"),
  deliveryDays: z.number().min(1, "Delivery must be at least 1 day"),
  coverLetter: z.string().min(10, "Cover letter must be at least 10 characters"),
});

export async function bidOnProject(data: z.infer<typeof BidProjectSchema>) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "FREELANCER") {
    return { error: "Only freelancers can bid" };
  }

  const validatedData = BidProjectSchema.safeParse(data);
  if (!validatedData.success) {
    return { error: "Invalid bid data" };
  }

  try {
    const project = await db.project.findUnique({
      where: { id: validatedData.data.projectId },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    if (project.creatorId === session.user.id) {
      return { error: "Cannot bid on own project" };
    }

    // Check existing bid
    const existingBid = await db.proposal.findFirst({
      where: {
        projectId: validatedData.data.projectId,
        freelancerId: session.user.id,
      },
    });

    if (existingBid) {
      // Update existing bid
      const updated = await db.proposal.update({
        where: { id: existingBid.id },
        data: {
          bidAmount: validatedData.data.bidAmount,
          deliveryDays: validatedData.data.deliveryDays,
          coverLetter: validatedData.data.coverLetter,
        },
      });
      return { success: true, proposalId: updated.id, updated: true };
    }

    // Create new bid
    const proposal = await db.proposal.create({
      data: {
        projectId: validatedData.data.projectId,
        freelancerId: session.user.id,
        bidAmount: validatedData.data.bidAmount,
        deliveryDays: validatedData.data.deliveryDays,
        coverLetter: validatedData.data.coverLetter,
      },
    });

    return { success: true, proposalId: proposal.id };
  } catch (error) {
    console.error("Bid on project error:", error);
    return { error: "Failed to submit bid" };
  }
}

export async function getMyBids() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return [];
  }

  try {
    const bids = await db.proposal.findMany({
      where: { freelancerId: session.user.id },
      include: {
        project: { include: { creator: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return bids;
  } catch (error) {
    console.error("Get my bids error:", error);
    return [];
  }
}

export async function getAvailableProjects(
  category?: string,
  minBudget?: number,
  maxBudget?: number
) {
  const session = await auth();

  try {
    const projects = await db.project.findMany({
      where: {
        status: "OPEN",
        creatorId: session?.user?.id ? { not: session.user.id } : undefined,
        ...(category && { category }),
        ...(minBudget && { budget: { gte: minBudget } }),
        ...(maxBudget && { budget: { lte: maxBudget } }),
      },
      include: {
        creator: true,
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return projects;
  } catch (error) {
    console.error("Get available projects error:", error);
    return [];
  }
}

export async function getProjectDetails(projectId: string) {
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        creator: true,
        proposals: {
          include: { freelancer: true },
        },
      },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    return project;
  } catch (error) {
    console.error("Get project details error:", error);
    return { error: "Failed to fetch project" };
  }
}

// ============ FREELANCER SALES ============

export async function getFreelancerSales() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return [];
  }

  try {
    const sales = await db.templatePurchase.findMany({
      where: { sellerId: session.user.id },
      include: {
        template: true,
        buyer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return sales;
  } catch (error) {
    console.error("Get freelancer sales error:", error);
    return [];
  }
}

export async function getFreelancerEarningsStats() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { totalEarnings: 0, totalSales: 0, thisMonth: 0 };
  }

  try {
    const wallet = await db.wallet.findUnique({
      where: { userId: session.user.id },
    });

    const sales = await db.templatePurchase.findMany({
      where: { sellerId: session.user.id },
    });

    const thisMonth = await db.templatePurchase.findMany({
      where: {
        sellerId: session.user.id,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(),
        },
      },
    });

    const totalEarnings = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const monthEarnings = thisMonth.reduce((sum, sale) => sum + sale.amount, 0);

    return {
      totalEarnings,
      totalSales: sales.length,
      thisMonth: monthEarnings,
      walletBalance: wallet?.balance || 0,
    };
  } catch (error) {
    console.error("Get earnings stats error:", error);
    return { totalEarnings: 0, totalSales: 0, thisMonth: 0, walletBalance: 0 };
  }
}
