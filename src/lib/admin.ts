import { $Enums } from "@prisma/client";

export const AdminActionDescriptions: Record<$Enums.AdminActionType, string> = {
  USER_BLOCKED: "User account blocked",
  USER_BANNED: "User account banned",
  USER_DELETED: "User account permanently deleted",
  TEMPLATE_APPROVED: "Template approved for marketplace",
  TEMPLATE_REJECTED: "Template rejected",
  TEMPLATE_DELETED: "Template removed from marketplace",
  PROJECT_REMOVED: "Project removed from platform",
  WITHDRAWAL_APPROVED: "Withdrawal request approved",
  WITHDRAWAL_REJECTED: "Withdrawal request rejected",
  OTHER: "Other admin action"
};

export const AdminActionColors: Record<$Enums.AdminActionType, string> = {
  USER_BLOCKED: "yellow",
  USER_BANNED: "red",
  USER_DELETED: "red",
  TEMPLATE_APPROVED: "green",
  TEMPLATE_REJECTED: "yellow",
  TEMPLATE_DELETED: "red",
  PROJECT_REMOVED: "red",
  WITHDRAWAL_APPROVED: "green",
  WITHDRAWAL_REJECTED: "yellow",
  OTHER: "blue"
};

export function isAdmin(role?: string): boolean {
  return role === "ADMIN";
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export function logAdminAction(
  action: $Enums.AdminActionType,
  adminId: string,
  targetId: string | null,
  description: string,
  metadata?: Record<string, any>
) {
  // This will be called from the API routes
  return {
    action,
    adminId,
    targetId,
    description,
    metadata: metadata ? JSON.stringify(metadata) : null
  };
}
