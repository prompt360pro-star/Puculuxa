-- CreateTable
CREATE TABLE "PaymentTermsConfig" (
    "id" TEXT NOT NULL,
    "segment" "ClientSegment" NOT NULL,
    "eventType" TEXT,
    "depositPercent" INTEGER NOT NULL DEFAULT 50,
    "depositDueDays" INTEGER NOT NULL DEFAULT 1,
    "balanceDueDays" INTEGER NOT NULL DEFAULT 3,
    "creditDueDays" INTEGER NOT NULL DEFAULT 60,
    "allowGpo" BOOLEAN NOT NULL DEFAULT true,
    "allowBankTransfer" BOOLEAN NOT NULL DEFAULT true,
    "allowCredit" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTermsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentTermsConfig_segment_idx" ON "PaymentTermsConfig"("segment");

-- CreateIndex
CREATE INDEX "PaymentTermsConfig_eventType_idx" ON "PaymentTermsConfig"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTermsConfig_segment_eventType_key" ON "PaymentTermsConfig"("segment", "eventType");
