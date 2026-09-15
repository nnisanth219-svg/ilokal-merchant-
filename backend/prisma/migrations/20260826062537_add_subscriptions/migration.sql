-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'expired', 'suspended');

-- CreateEnum
CREATE TYPE "subscription_plan_type" AS ENUM ('Monthly', 'Annual');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "subscriptionCode" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "plan" "subscription_plan_type" NOT NULL,
    "billing" "subscription_plan_type" NOT NULL,
    "startDate" DATE NOT NULL,
    "expiryDate" DATE NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'active',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "payments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscriptionCode_key" ON "subscriptions"("subscriptionCode");

-- CreateIndex
CREATE INDEX "subscriptions_memberId_idx" ON "subscriptions"("memberId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_plan_idx" ON "subscriptions"("plan");

-- CreateIndex
CREATE INDEX "subscriptions_billing_idx" ON "subscriptions"("billing");

-- CreateIndex
CREATE INDEX "subscriptions_expiryDate_idx" ON "subscriptions"("expiryDate");

-- CreateIndex
CREATE INDEX "subscriptions_createdAt_idx" ON "subscriptions"("createdAt");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
