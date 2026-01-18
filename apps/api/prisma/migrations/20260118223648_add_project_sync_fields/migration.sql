-- AlterTable
ALTER TABLE "Project" ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN "lastSyncStatus" TEXT;
