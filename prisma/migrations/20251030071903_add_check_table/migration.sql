-- CreateTable
CREATE TABLE "Check" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "isUp" BOOLEAN NOT NULL,
    "error" TEXT,

    CONSTRAINT "Check_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
