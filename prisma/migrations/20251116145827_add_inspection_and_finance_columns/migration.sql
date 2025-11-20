-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CaseState" ADD VALUE 'PO_APPROVED';
ALTER TYPE "CaseState" ADD VALUE 'PROGRESS_BILLING';
ALTER TYPE "CaseState" ADD VALUE 'PMT_INSPECTION';

-- AlterTable
ALTER TABLE "Check" ADD COLUMN     "approvedBy" TEXT;

-- AlterTable
ALTER TABLE "DV" ADD COLUMN     "approvedBy" TEXT;

-- AlterTable
ALTER TABLE "InspectionReport" ADD COLUMN     "coaSignatory" TEXT,
ADD COLUMN     "coaSignedAt" TIMESTAMP(3),
ADD COLUMN     "endUserSignatory" TEXT,
ADD COLUMN     "endUserSignedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ORS" ADD COLUMN     "approvedBy" TEXT;

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "poNo" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressBilling" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "billingNo" TEXT,
    "amount" DECIMAL(18,2),
    "billedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ProgressBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PMTInspectionReport" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "InspectionStatus",
    "inspector" TEXT,
    "inspectedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "PMTInspectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_caseId_key" ON "PurchaseOrder"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressBilling_caseId_key" ON "ProgressBilling"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "PMTInspectionReport_caseId_key" ON "PMTInspectionReport"("caseId");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressBilling" ADD CONSTRAINT "ProgressBilling_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMTInspectionReport" ADD CONSTRAINT "PMTInspectionReport_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
