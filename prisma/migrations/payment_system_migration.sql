-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING';
ALTER TYPE "PaymentStatus" ADD VALUE 'SUCCEEDED';
ALTER TYPE "PaymentStatus" ADD VALUE 'FAILED';
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "EscrowStatus" ADD VALUE 'HELD';
ALTER TYPE "EscrowStatus" ADD VALUE 'RELEASED';
ALTER TYPE "EscrowStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'CREDIT';
ALTER TYPE "TransactionType" ADD VALUE 'DEBIT';

-- AlterEnum
ALTER TYPE "WithdrawalStatus" ADD VALUE 'PENDING';
ALTER TYPE "WithdrawalStatus" ADD VALUE 'APPROVED';
ALTER TYPE "WithdrawalStatus" ADD VALUE 'REJECTED';
ALTER TYPE "WithdrawalStatus" ADD VALUE 'COMPLETED';

-- AlterTable "User"
ALTER TABLE "User" ADD COLUMN "stripeAccountId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

-- AlterTable "Order"
ALTER TABLE "Order" ADD COLUMN "freelancerId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN "escrowStatus" "EscrowStatus" NOT NULL DEFAULT 'HELD';
ALTER TABLE "Order" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "stripeSessionId" TEXT;
ALTER TABLE "Order" ADD COLUMN "transactionId" TEXT;

CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_escrowStatus_idx" ON "Order"("escrowStatus");
CREATE INDEX "Order_stripePaymentIntentId_idx" ON "Order"("stripePaymentIntentId");

-- AlterTable "TemplatePurchase"
ALTER TABLE "TemplatePurchase" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "TemplatePurchase" ADD COLUMN "escrowStatus" "EscrowStatus" NOT NULL DEFAULT 'HELD';
ALTER TABLE "TemplatePurchase" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "TemplatePurchase" ADD COLUMN "stripeSessionId" TEXT;
ALTER TABLE "TemplatePurchase" ADD COLUMN "transactionId" TEXT;
ALTER TABLE "TemplatePurchase" ADD COLUMN "fileDownloadUrl" TEXT;
ALTER TABLE "TemplatePurchase" ADD COLUMN "downloadCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "TemplatePurchase_paymentStatus_idx" ON "TemplatePurchase"("paymentStatus");
CREATE INDEX "TemplatePurchase_escrowStatus_idx" ON "TemplatePurchase"("escrowStatus");

-- AlterTable "Transaction"
ALTER TABLE "Transaction" DROP COLUMN "type";
ALTER TABLE "Transaction" DROP COLUMN "status";
ALTER TABLE "Transaction" ADD COLUMN "type" "TransactionType" NOT NULL DEFAULT 'DEBIT';
ALTER TABLE "Transaction" ADD COLUMN "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCEEDED';
ALTER TABLE "Transaction" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "referenceId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "metadata" TEXT;

CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateTable "WithdrawalRequest"
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "bankAccountLastFour" TEXT,
    "stripePayoutId" TEXT,
    "reason" TEXT,
    "adminNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WithdrawalRequest_userId_idx" ON "WithdrawalRequest"("userId");
CREATE INDEX "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
