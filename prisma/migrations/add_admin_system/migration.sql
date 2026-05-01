-- Add TemplateStatus enum values
ALTER TYPE "TemplateStatus" ADD VALUE 'PENDING';
ALTER TYPE "TemplateStatus" ADD VALUE 'APPROVED';
ALTER TYPE "TemplateStatus" ADD VALUE 'REJECTED';

-- Add AdminActionType enum
CREATE TYPE "AdminActionType" AS ENUM (
  'USER_BLOCKED',
  'USER_DELETED',
  'TEMPLATE_APPROVED',
  'TEMPLATE_REJECTED',
  'TEMPLATE_DELETED',
  'PROJECT_REMOVED',
  'WITHDRAWAL_APPROVED',
  'WITHDRAWAL_REJECTED',
  'OTHER'
);

-- Add status column to Template table if it doesn't exist
ALTER TABLE "Template"
ADD COLUMN IF NOT EXISTS "status" "TemplateStatus" DEFAULT 'PENDING';

-- Create AdminLog table
CREATE TABLE IF NOT EXISTS "AdminLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "action" "AdminActionType" NOT NULL,
  "adminId" TEXT NOT NULL,
  "targetId" TEXT,
  "targetType" TEXT,
  "description" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create AdminNotification table
CREATE TABLE IF NOT EXISTS "AdminNotification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actionUrl" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for AdminLog
CREATE INDEX IF NOT EXISTS "AdminLog_adminId_idx" ON "AdminLog"("adminId");
CREATE INDEX IF NOT EXISTS "AdminLog_action_idx" ON "AdminLog"("action");
CREATE INDEX IF NOT EXISTS "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AdminLog_targetId_idx" ON "AdminLog"("targetId");

-- Create indexes for AdminNotification
CREATE INDEX IF NOT EXISTS "AdminNotification_type_idx" ON "AdminNotification"("type");
CREATE INDEX IF NOT EXISTS "AdminNotification_isRead_idx" ON "AdminNotification"("isRead");
CREATE INDEX IF NOT EXISTS "AdminNotification_priority_idx" ON "AdminNotification"("priority");
CREATE INDEX IF NOT EXISTS "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- Create index for Template status
CREATE INDEX IF NOT EXISTS "Template_status_idx" ON "Template"("status");
