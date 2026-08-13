-- CreateEnum
CREATE TYPE "InsightsStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- DropIndex
DROP INDEX "Job_isActive_deadline_idx";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "insights" JSONB,
ADD COLUMN     "insightsStatus" "InsightsStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "deadline" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "rawResponse" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Application_userId_insightsStatus_idx" ON "Application"("userId", "insightsStatus");
