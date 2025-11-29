-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'TRANSITION');

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "after" JSONB,
ADD COLUMN     "before" JSONB,
ADD COLUMN     "changeType" "ChangeType" NOT NULL DEFAULT 'TRANSITION',
ADD COLUMN     "entity" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "isOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "performedByRole" "UserRole",
ADD COLUMN     "reason" TEXT;
