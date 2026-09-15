-- CreateEnum
CREATE TYPE "offer_status" AS ENUM ('live', 'scheduled', 'draft', 'expired', 'paused');

-- CreateEnum
CREATE TYPE "offer_type" AS ENUM ('percentage', 'fixed', 'free_item', 'set_price', 'other', 'bogo', 'free_gift', 'member_pricing', 'voucher');

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "offerCode" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "termsAndConditions" TEXT NOT NULL DEFAULT '',
    "offerType" "offer_type" NOT NULL,
    "benefitLabel" TEXT NOT NULL DEFAULT '',
    "benefitValue" TEXT NOT NULL DEFAULT '',
    "eligibility" TEXT NOT NULL DEFAULT '',
    "validFrom" DATE NOT NULL,
    "validTo" DATE NOT NULL,
    "validityLabel" TEXT NOT NULL DEFAULT '',
    "redemptionInstructions" TEXT NOT NULL DEFAULT '',
    "redemptionLimit" TEXT NOT NULL DEFAULT '',
    "maxRedemptions" INTEGER,
    "maxRedemptionsPerMember" INTEGER,
    "imageUrl" TEXT,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "offer_status" NOT NULL DEFAULT 'draft',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offers_offerCode_key" ON "offers"("offerCode");

-- CreateIndex
CREATE INDEX "offers_merchantId_idx" ON "offers"("merchantId");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE INDEX "offers_deletedAt_idx" ON "offers"("deletedAt");

-- CreateIndex
CREATE INDEX "offers_offerType_idx" ON "offers"("offerType");

-- CreateIndex
CREATE INDEX "offers_validFrom_idx" ON "offers"("validFrom");

-- CreateIndex
CREATE INDEX "offers_validTo_idx" ON "offers"("validTo");

-- CreateIndex
CREATE INDEX "offers_createdAt_idx" ON "offers"("createdAt");

-- CreateIndex
CREATE INDEX "offers_title_idx" ON "offers"("title");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
