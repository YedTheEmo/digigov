-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CaseState" ADD VALUE 'BID_BULLETIN';
ALTER TYPE "CaseState" ADD VALUE 'PRE_BID_CONF';
ALTER TYPE "CaseState" ADD VALUE 'BID_SUBMISSION_OPENING';
ALTER TYPE "CaseState" ADD VALUE 'TWG_EVALUATION';
ALTER TYPE "CaseState" ADD VALUE 'POST_QUALIFICATION';

-- CreateTable
CREATE TABLE "BidBulletin" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "number" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "BidBulletin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreBidConference" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "minutesUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "PreBidConference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "bidderName" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "isResponsive" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TWGEvaluation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "result" TEXT,
    "notes" TEXT,
    "evaluatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TWGEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostQualification" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "lowestResponsiveBidder" TEXT,
    "passed" BOOLEAN,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PostQualification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BidBulletin_caseId_idx" ON "BidBulletin"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "PreBidConference_caseId_key" ON "PreBidConference"("caseId");

-- CreateIndex
CREATE INDEX "Bid_caseId_idx" ON "Bid"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "TWGEvaluation_caseId_key" ON "TWGEvaluation"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "PostQualification_caseId_key" ON "PostQualification"("caseId");

-- AddForeignKey
ALTER TABLE "BidBulletin" ADD CONSTRAINT "BidBulletin_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreBidConference" ADD CONSTRAINT "PreBidConference_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TWGEvaluation" ADD CONSTRAINT "TWGEvaluation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostQualification" ADD CONSTRAINT "PostQualification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
