-- CreateEnum
CREATE TYPE "merchant_status" AS ENUM ('active', 'pending', 'inactive');

-- CreateEnum
CREATE TYPE "merchant_outlet_type" AS ENUM ('single', 'multi', 'online');

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "merchantCode" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "legalName" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "subCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL DEFAULT '',
    "registrationNo" TEXT NOT NULL DEFAULT '',
    "priceRange" TEXT NOT NULL DEFAULT 'RM RM',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "postcode" TEXT NOT NULL DEFAULT '',
    "latitude" TEXT NOT NULL DEFAULT '',
    "longitude" TEXT NOT NULL DEFAULT '',
    "outletType" "merchant_outlet_type" NOT NULL DEFAULT 'single',
    "picName" TEXT NOT NULL DEFAULT '',
    "hoursWeekday" TEXT NOT NULL DEFAULT '',
    "hoursWeekend" TEXT NOT NULL DEFAULT '',
    "hoursPublicHoliday" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "merchant_status" NOT NULL DEFAULT 'pending',
    "offersCount" INTEGER NOT NULL DEFAULT 0,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingsCount" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "redeemed30d" INTEGER NOT NULL DEFAULT 0,
    "uniqueMembers" INTEGER NOT NULL DEFAULT 0,
    "membersReached" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT '',
    "offers" JSONB NOT NULL DEFAULT '[]',
    "activities" JSONB NOT NULL DEFAULT '[]',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_merchantCode_key" ON "merchants"("merchantCode");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_slug_key" ON "merchants"("slug");

-- CreateIndex
CREATE INDEX "merchants_status_idx" ON "merchants"("status");

-- CreateIndex
CREATE INDEX "merchants_deletedAt_idx" ON "merchants"("deletedAt");

-- CreateIndex
CREATE INDEX "merchants_category_idx" ON "merchants"("category");

-- CreateIndex
CREATE INDEX "merchants_state_idx" ON "merchants"("state");

-- CreateIndex
CREATE INDEX "merchants_businessName_idx" ON "merchants"("businessName");

-- CreateIndex
CREATE INDEX "merchants_createdAt_idx" ON "merchants"("createdAt");

-- CreateIndex
CREATE INDEX "merchants_email_idx" ON "merchants"("email");
