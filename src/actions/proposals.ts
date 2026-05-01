"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

const SubmitProposalSchema = z.object({
  projectId: z.string(),
  bidAmount: z.number().min(10),
  coverLetter: z.string().min(50, "Cover letter must be at least 50 characters"),
  deliveryDays: z.number().min(1).max(365),
});

export async function submitProposal(data: z.infer<typeof SubmitProposalSchema>) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "FREELANCER") {
    return { error: "Only freelancers can submit proposals" };
  }

  const validated = SubmitProposalSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0]?.message || "Invalid proposal data" };
  }

  try {
    const project = await db.project.findUnique({
      where: { id: validated.data.projectId },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    if (project.creatorId === session.user.id) {
      return { error: "Cannot bid on your own project" };
    }

    // Check if already submitted
    const existing = await db.proposal.findFirst({
      where: {
        projectId: validated.data.projectId,
        freelancerId: session.user.id,
      },
    });

    if (existing) {
      return { error: "You already submitted a proposal for this project" };
    }

    const proposal = await db.proposal.create({
      data: {
        projectId: validated.data.projectId,
        freelancerId: session.user.id,
        bidAmount: validated.data.bidAmount,
        coverLetter: validated.data.coverLetter,
        deliveryDays: validated.data.deliveryDays,
      },
    });

    // Notify client
    await db.notification.create({
      data: {
        userId: project.creatorId,
        type: "BID_RECEIVED",
        message: `New proposal received for "${project.title}"`,
        actionUrl: `/projects/${project.id}`,
      },
    });

    logger.info("Proposal submitted", { proposalId: proposal.id, projectId: project.id });

    return { success: true, proposalId: proposal.id };
  } catch (error) {
    logger.error("Submit proposal error", { error: String(error) });
    return { error: "Failed to submit proposal" };
  }
}

export async function getProjectProposals(projectId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { error: "Project not found" };
    }

    if (project.creatorId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const proposals = await db.proposal.findMany({
      where: { projectId },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            rating: true,
            reviewCount: true,
            skills: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return proposals;
  } catch (error) {
    logger.error("Get proposals error", { error: String(error) });
    return { error: "Failed to fetch proposals" };
  }
}

export async function getFreelancerProposals() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const proposals = await db.proposal.findMany({
      where: { freelancerId: session.user.id },
      include: {
        project: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return proposals;
  } catch (error) {
    logger.error("Get freelancer proposals error", { error: String(error) });
    return { error: "Failed to fetch proposals" };
  }
}

export async function withdrawProposal(proposalId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return { error: "Proposal not found" };
    }

    if (proposal.freelancerId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await db.proposal.delete({
      where: { id: proposalId },
    });

    logger.info("Proposal withdrawn", { proposalId });

    return { success: true };
  } catch (error) {
    logger.error("Withdraw proposal error", { error: String(error) });
    return { error: "Failed to withdraw proposal" };
  }
}
