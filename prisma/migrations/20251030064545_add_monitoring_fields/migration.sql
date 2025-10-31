/*
  Warnings:

  - You are about to drop the column `lastStatus` on the `Website` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Website" DROP COLUMN "lastStatus",
ADD COLUMN     "responseTime" INTEGER,
ADD COLUMN     "status" TEXT DEFAULT 'UNKNOWN',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
