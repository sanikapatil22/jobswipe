-- Add live ATS job sync columns and backfill legacy seeded rows.

-- CreateEnum
CREATE TYPE "AtsType" AS ENUM ('GREENHOUSE', 'LEVER');

-- Add columns in a nullable/backfill-friendly way first.
ALTER TABLE "Job" ADD COLUMN "companySlug" TEXT;
ALTER TABLE "Job" ADD COLUMN "ats" "AtsType" NOT NULL DEFAULT 'GREENHOUSE';
ALTER TABLE "Job" ADD COLUMN "sourceKey" TEXT;
ALTER TABLE "Job" ADD COLUMN "jobId" TEXT;
ALTER TABLE "Job" ADD COLUMN "title" TEXT;
ALTER TABLE "Job" ADD COLUMN "descriptionHTML" TEXT;
ALTER TABLE "Job" ADD COLUMN "updatedAtSource" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN "rawResponse" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "Job" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill legacy rows from the previous mock-seeded schema.
UPDATE "Job"
SET
  "companySlug" = trim(both '-' from regexp_replace(lower("companyName"), '[^a-z0-9]+', '-', 'g')),
  "sourceKey" = 'legacy:' || "id",
  "jobId" = "id",
  "title" = "role",
  "descriptionHTML" = '<p>' || replace(replace(replace(coalesce("description", ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>',
  "rawResponse" = jsonb_build_object(
    'legacy', true,
    'id', "id",
    'companyName', "companyName",
    'companyLogo', "companyLogo",
    'role', "role",
    'description', "description",
    'requirements', "requirements",
    'salary', "salary",
    'location', "location",
    'workType', "workType",
    'companySize', "companySize",
    'deadline', "deadline",
    'applyUrl', "applyUrl",
    'tags', "tags",
    'isActive', "isActive",
    'createdAt', "createdAt"
  );

-- Enforce the new invariants expected by the application.
ALTER TABLE "Job" ALTER COLUMN "companySlug" SET NOT NULL;
ALTER TABLE "Job" ALTER COLUMN "sourceKey" SET NOT NULL;
ALTER TABLE "Job" ALTER COLUMN "jobId" SET NOT NULL;
ALTER TABLE "Job" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "Job" ALTER COLUMN "descriptionHTML" SET NOT NULL;

-- Create the new unique and supporting indexes.
ALTER TABLE "Job" ADD CONSTRAINT "Job_sourceKey_key" UNIQUE ("sourceKey");
CREATE INDEX "Job_companySlug_ats_idx" ON "Job"("companySlug", "ats");

-- Preserve the existing createdAt timestamp as the live feed's first published date for legacy rows.
ALTER TABLE "Job" ADD COLUMN "firstPublished" TIMESTAMP(3);
UPDATE "Job" SET "firstPublished" = "createdAt" WHERE "firstPublished" IS NULL;

-- Support the updated feed ordering/indexing.
CREATE INDEX "Job_isActive_firstPublished_idx" ON "Job"("isActive", "firstPublished");