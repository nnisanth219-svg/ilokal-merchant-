-- CreateEnum
CREATE TYPE "redemption_status" AS ENUM ('successful', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('published', 'pending', 'flagged', 'hidden');

-- CreateTable
CREATE TABLE "redemptions" (
    "id" TEXT NOT NULL,
    "redemptionCode" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL,
    "status" "redemption_status" NOT NULL DEFAULT 'successful',
    "method" TEXT NOT NULL DEFAULT 'QR scan',
    "verificationStatus" TEXT NOT NULL DEFAULT 'Verified',
    "activity" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "status" "review_status" NOT NULL DEFAULT 'pending',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "redemptions_redemptionCode_key" ON "redemptions"("redemptionCode");

-- CreateIndex
CREATE INDEX "redemptions_memberId_idx" ON "redemptions"("memberId");

-- CreateIndex
CREATE INDEX "redemptions_merchantId_idx" ON "redemptions"("merchantId");

-- CreateIndex
CREATE INDEX "redemptions_offerId_idx" ON "redemptions"("offerId");

-- CreateIndex
CREATE INDEX "redemptions_status_idx" ON "redemptions"("status");

-- CreateIndex
CREATE INDEX "redemptions_redeemedAt_idx" ON "redemptions"("redeemedAt");

-- CreateIndex
CREATE INDEX "redemptions_createdAt_idx" ON "redemptions"("createdAt");

-- CreateIndex
CREATE INDEX "reviews_memberId_idx" ON "reviews"("memberId");

-- CreateIndex
CREATE INDEX "reviews_merchantId_idx" ON "reviews"("merchantId");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_submittedAt_idx" ON "reviews"("submittedAt");

-- CreateIndex
CREATE INDEX "reviews_deletedAt_idx" ON "reviews"("deletedAt");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "reviews"("createdAt");

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
