-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PROCUREMENT_MANAGER', 'SUPPLY_MANAGER', 'BUDGET_MANAGER', 'ACCOUNTING_MANAGER', 'CASHIER_MANAGER', 'BAC_SECRETARIAT', 'TWG_MEMBER', 'APPROVER');

-- CreateEnum
CREATE TYPE "Section" AS ENUM ('PROCUREMENT', 'SUPPLY', 'BUDGET', 'ACCOUNTING', 'CASHIER');

-- CreateEnum
CREATE TYPE "Regime" AS ENUM ('RA12009', 'RA9184');

-- CreateEnum
CREATE TYPE "ProcurementMethod" AS ENUM ('SMALL_VALUE_RFQ', 'PUBLIC_BIDDING', 'INFRASTRUCTURE');

-- CreateEnum
CREATE TYPE "CaseState" AS ENUM ('DRAFT', 'POSTING', 'RFQ_ISSUED', 'QUOTATION_COLLECTION', 'ABSTRACT_OF_QUOTATIONS', 'BAC_RESOLUTION', 'AWARDED', 'CONTRACT_SIGNED', 'NTP_ISSUED', 'DELIVERY', 'INSPECTION', 'ACCEPTANCE', 'ORS', 'DV', 'CHECK', 'CLOSED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "hashedPassword" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PROCUREMENT_MANAGER',
    "section" "Section",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "oauth_token_secret" TEXT,
    "oauth_token" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ProcurementCase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "method" "ProcurementMethod" NOT NULL,
    "regime" "Regime" NOT NULL DEFAULT 'RA9184',
    "abc" DECIMAL(18,2),
    "currentState" "CaseState" NOT NULL DEFAULT 'DRAFT',
    "endUserUnit" TEXT,
    "postingStartAt" TIMESTAMP(3),
    "postingEndAt" TIMESTAMP(3),
    "deliveryDueAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "rfqNumber" TEXT,
    "issuedAt" TIMESTAMP(3),

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "isResponsive" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbstractOfQuotations" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "AbstractOfQuotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BACResolution" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "BACResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "noticeDate" TIMESTAMP(3),
    "awardedTo" TEXT,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3),
    "contractNo" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoticeToProceed" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "daysToComply" INTEGER,

    CONSTRAINT "NoticeToProceed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionReport" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "InspectionStatus",
    "inspector" TEXT,
    "inspectedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Acceptance" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "officer" TEXT,

    CONSTRAINT "Acceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ORS" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "orsNumber" TEXT,
    "preparedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ORS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DV" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "dvNumber" TEXT,
    "preparedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "DV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Check" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "checkNumber" TEXT,
    "preparedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckAdvice" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "adviceNumber" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "CheckAdvice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "fromState" "CaseState",
    "toState" "CaseState",
    "legalBasis" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "RFQ_caseId_key" ON "RFQ"("caseId");

-- CreateIndex
CREATE INDEX "Quotation_caseId_idx" ON "Quotation"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "AbstractOfQuotations_caseId_key" ON "AbstractOfQuotations"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "BACResolution_caseId_key" ON "BACResolution"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Award_caseId_key" ON "Award"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_caseId_key" ON "Contract"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "NoticeToProceed_caseId_key" ON "NoticeToProceed"("caseId");

-- CreateIndex
CREATE INDEX "Delivery_caseId_idx" ON "Delivery"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionReport_caseId_key" ON "InspectionReport"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Acceptance_caseId_key" ON "Acceptance"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "ORS_caseId_key" ON "ORS"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "DV_caseId_key" ON "DV"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Check_caseId_key" ON "Check"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckAdvice_caseId_key" ON "CheckAdvice"("caseId");

-- CreateIndex
CREATE INDEX "Attachment_caseId_idx" ON "Attachment"("caseId");

-- CreateIndex
CREATE INDEX "ActivityLog_caseId_idx" ON "ActivityLog"("caseId");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- CreateIndex
CREATE INDEX "Reminder_caseId_idx" ON "Reminder"("caseId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementCase" ADD CONSTRAINT "ProcurementCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbstractOfQuotations" ADD CONSTRAINT "AbstractOfQuotations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BACResolution" ADD CONSTRAINT "BACResolution_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeToProceed" ADD CONSTRAINT "NoticeToProceed_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acceptance" ADD CONSTRAINT "Acceptance_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ORS" ADD CONSTRAINT "ORS_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DV" ADD CONSTRAINT "DV_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckAdvice" ADD CONSTRAINT "CheckAdvice_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ProcurementCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
