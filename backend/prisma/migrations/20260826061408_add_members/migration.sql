-- CreateEnum
CREATE TYPE "member_status" AS ENUM ('active', 'expired', 'suspended', 'inactive');

-- CreateEnum
CREATE TYPE "membership_plan" AS ENUM ('Annual', 'Monthly', 'None');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "memberCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "status" "member_status" NOT NULL DEFAULT 'active',
    "plan" "membership_plan" NOT NULL DEFAULT 'None',
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "totalPurchases" INTEGER NOT NULL DEFAULT 0,
    "totalRedemptions" INTEGER NOT NULL DEFAULT 0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "deviceName" TEXT NOT NULL DEFAULT '',
    "lastActiveAt" TIMESTAMP(3),
    "appVersion" TEXT NOT NULL DEFAULT '',
    "platform" TEXT NOT NULL DEFAULT '',
    "paymentStatus" TEXT NOT NULL DEFAULT '',
    "purchases" JSONB NOT NULL DEFAULT '[]',
    "redemptions" JSONB NOT NULL DEFAULT '[]',
    "reviews" JSONB NOT NULL DEFAULT '[]',
    "supportNotes" JSONB NOT NULL DEFAULT '[]',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_memberCode_key" ON "members"("memberCode");

-- CreateIndex
CREATE INDEX "members_email_idx" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_status_idx" ON "members"("status");

-- CreateIndex
CREATE INDEX "members_deletedAt_idx" ON "members"("deletedAt");

-- CreateIndex
CREATE INDEX "members_createdAt_idx" ON "members"("createdAt");

-- CreateIndex
CREATE INDEX "members_fullName_idx" ON "members"("fullName");

-- CreateIndex
CREATE INDEX "members_joinedAt_idx" ON "members"("joinedAt");

-- CreateIndex
CREATE INDEX "members_plan_idx" ON "members"("plan");
