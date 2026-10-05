-- AlterTable
ALTER TABLE "TABLE_SCORE" ADD COLUMN     "allowRetry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "previousScore" TEXT,
ADD COLUMN     "retryDeadline" TIMESTAMP(3);
