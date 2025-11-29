-- DropIndex
DROP INDEX "public"."PMTInspectionReport_caseId_key";

-- DropIndex
DROP INDEX "public"."ProgressBilling_caseId_key";

-- CreateIndex
CREATE INDEX "PMTInspectionReport_caseId_idx" ON "PMTInspectionReport"("caseId");

-- CreateIndex
CREATE INDEX "ProgressBilling_caseId_idx" ON "ProgressBilling"("caseId");
