-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('APPYPAY_GPO', 'APPYPAY_REF', 'BANK_TRANSFER', 'GOVERNMENT_CREDIT', 'CASH');

-- CreateEnum
CREATE TYPE "FollowUpChannel" AS ENUM ('PHONE', 'EMAIL', 'WHATSAPP', 'IN_PERSON', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FollowUpOutcome" AS ENUM ('NO_RESPONSE', 'PROMISED_PAYMENT', 'REQUESTED_DOCUMENTS', 'SENT_TO_TREASURY', 'ORDER_OF_WITHDRAWAL_PENDING', 'PAID_CONFIRMED', 'OTHER');

-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AWAITING_PROOF', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'IN_CREDIT', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('PUSH', 'EMAIL', 'WHATSAPP', 'INTERNAL');

-- CreateEnum
CREATE TYPE "PaymentReminderType" AS ENUM ('PAYMENT_PENDING_GPO', 'PAYMENT_AWAITING_PROOF', 'PAYMENT_AWAITING_VALIDATION', 'CREDIT_DUE_SOON', 'CREDIT_OVERDUE');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "ClientSegment" AS ENUM ('B2C', 'B2B', 'GOVERNMENT');

-- CreateEnum
CREATE TYPE "PayoutProvider" AS ENUM ('APPYPAY');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('DRAFT', 'REPORTED', 'PAID', 'DISCREPANCY', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutSource" AS ENUM ('MANUAL', 'API');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "tags" TEXT,
    "servings" INTEGER,
    "prepTimeDays" INTEGER,
    "suggestedEvents" TEXT,
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "complexityBase" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "eventDate" TIMESTAMP(3),
    "description" TEXT,
    "referenceImage" TEXT,
    "complexityScore" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'APP',
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "estimatedTotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "slaDeadline" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "convertedOrderId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerId" TEXT,
    "rejectionReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationVersion" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "response" TEXT,
    "changedBy" TEXT NOT NULL,
    "changes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationComplement" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationComplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusAuditLog" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenCapacity" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "maxOrders" INTEGER NOT NULL DEFAULT 5,
    "bookedOrders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KitchenCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaConfig" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "deadlineHours" INTEGER NOT NULL DEFAULT 2,
    "businessStart" INTEGER NOT NULL DEFAULT 8,
    "businessEnd" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "SlaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "nextReminder" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sourceOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "avatarUrl" TEXT,
    "address" TEXT,
    "city" TEXT,
    "resetToken" TEXT,
    "refreshToken" TEXT,
    "pushToken" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "financialStatus" "FinancialStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMode" "PaymentMethod",
    "deletedAt" TIMESTAMP(3),
    "convertedFromId" TEXT,
    "creditDueDate" TIMESTAMP(3),
    "creditApprovedAt" TIMESTAMP(3),
    "creditApprovedById" TEXT,
    "creditNotes" TEXT,
    "debtorEntityName" TEXT,
    "debtorEntityNif" TEXT,
    "debtorProcessRef" TEXT,
    "lastPaymentFollowUpAt" TIMESTAMP(3),
    "clientSegment" "ClientSegment" NOT NULL DEFAULT 'B2C',
    "depositPercentApplied" INTEGER,
    "depositAmount" DOUBLE PRECISION,
    "depositDueDate" TIMESTAMP(3),
    "balanceDueDate" TIMESTAMP(3),
    "termsAppliedAt" TIMESTAMP(3),
    "termsAppliedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "adminReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sender" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "merchantRef" TEXT,
    "idempotencyKey" TEXT,
    "proofUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "provider" "PayoutProvider" NOT NULL DEFAULT 'APPYPAY',
    "source" "PayoutSource" NOT NULL DEFAULT 'MANUAL',
    "status" "PayoutStatus" NOT NULL DEFAULT 'DRAFT',
    "providerPayoutRef" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'AOA',
    "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "bankName" TEXT,
    "bankIban" TEXT,
    "bankReference" TEXT,
    "valueDate" TIMESTAMP(3),
    "statementUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutItem" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReminderLog" (
    "id" TEXT NOT NULL,
    "type" "PaymentReminderType" NOT NULL,
    "channel" "ReminderChannel" NOT NULL DEFAULT 'PUSH',
    "orderId" TEXT,
    "paymentId" TEXT,
    "userId" TEXT,
    "target" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "PaymentReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "prefix" TEXT,
    "year" INTEGER,
    "sequenceNumber" INTEGER,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "isGovernment" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceConfig" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT 'PF',
    "year" INTEGER NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 5,
    "format" TEXT NOT NULL DEFAULT '{prefix} {year}/{number}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyPoints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_followup_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "channel" "FollowUpChannel" NOT NULL DEFAULT 'PHONE',
    "outcome" "FollowUpOutcome" NOT NULL DEFAULT 'OTHER',
    "note" TEXT NOT NULL,
    "nextFollowUpAt" TIMESTAMP(3),
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_followup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'pt_PT',
    "status" "WhatsAppMessageStatus" NOT NULL DEFAULT 'PENDING',
    "waMessageId" TEXT,
    "conversationId" TEXT,
    "webhookStatusRaw" JSONB,
    "idempotencyKey" TEXT,
    "variables" JSONB,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_popularityScore_idx" ON "Product"("popularityScore");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_customerId_idx" ON "Quotation"("customerId");

-- CreateIndex
CREATE INDEX "Quotation_createdAt_idx" ON "Quotation"("createdAt");

-- CreateIndex
CREATE INDEX "Quotation_slaDeadline_idx" ON "Quotation"("slaDeadline");

-- CreateIndex
CREATE INDEX "QuotationVersion_quotationId_idx" ON "QuotationVersion"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationComplement_quotationId_idx" ON "QuotationComplement"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationItem_productId_idx" ON "QuotationItem"("productId");

-- CreateIndex
CREATE INDEX "StatusAuditLog_quotationId_idx" ON "StatusAuditLog"("quotationId");

-- CreateIndex
CREATE INDEX "StatusAuditLog_createdAt_idx" ON "StatusAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KitchenCapacity_date_key" ON "KitchenCapacity"("date");

-- CreateIndex
CREATE INDEX "KitchenCapacity_date_idx" ON "KitchenCapacity"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SlaConfig_eventType_key" ON "SlaConfig"("eventType");

-- CreateIndex
CREATE INDEX "EventReminder_userId_idx" ON "EventReminder"("userId");

-- CreateIndex
CREATE INDEX "EventReminder_nextReminder_idx" ON "EventReminder"("nextReminder");

-- CreateIndex
CREATE INDEX "EventReminder_status_idx" ON "EventReminder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Order_convertedFromId_key" ON "Order"("convertedFromId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_financialStatus_idx" ON "Order"("financialStatus");

-- CreateIndex
CREATE INDEX "Order_creditDueDate_idx" ON "Order"("creditDueDate");

-- CreateIndex
CREATE INDEX "Order_paymentMode_idx" ON "Order"("paymentMode");

-- CreateIndex
CREATE INDEX "Order_clientSegment_idx" ON "Order"("clientSegment");

-- CreateIndex
CREATE INDEX "Order_depositDueDate_idx" ON "Order"("depositDueDate");

-- CreateIndex
CREATE INDEX "Order_balanceDueDate_idx" ON "Order"("balanceDueDate");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_orderId_key" ON "Feedback"("orderId");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Review_productId_idx" ON "Review"("productId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_merchantRef_key" ON "Payment"("merchantRef");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_providerPayoutRef_key" ON "Payout"("providerPayoutRef");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "Payout_provider_idx" ON "Payout"("provider");

-- CreateIndex
CREATE INDEX "Payout_periodStart_idx" ON "Payout"("periodStart");

-- CreateIndex
CREATE INDEX "Payout_periodEnd_idx" ON "Payout"("periodEnd");

-- CreateIndex
CREATE INDEX "Payout_valueDate_idx" ON "Payout"("valueDate");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutItem_paymentId_key" ON "PayoutItem"("paymentId");

-- CreateIndex
CREATE INDEX "PayoutItem_payoutId_idx" ON "PayoutItem"("payoutId");

-- CreateIndex
CREATE INDEX "PaymentReminderLog_type_idx" ON "PaymentReminderLog"("type");

-- CreateIndex
CREATE INDEX "PaymentReminderLog_orderId_idx" ON "PaymentReminderLog"("orderId");

-- CreateIndex
CREATE INDEX "PaymentReminderLog_paymentId_idx" ON "PaymentReminderLog"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentReminderLog_userId_idx" ON "PaymentReminderLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceConfig_prefix_year_key" ON "InvoiceConfig"("prefix", "year");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyPoints_userId_key" ON "LoyaltyPoints"("userId");

-- CreateIndex
CREATE INDEX "LoyaltyPoints_userId_idx" ON "LoyaltyPoints"("userId");

-- CreateIndex
CREATE INDEX "payment_followup_logs_orderId_idx" ON "payment_followup_logs"("orderId");

-- CreateIndex
CREATE INDEX "payment_followup_logs_createdAt_idx" ON "payment_followup_logs"("createdAt");

-- CreateIndex
CREATE INDEX "payment_followup_logs_nextFollowUpAt_idx" ON "payment_followup_logs"("nextFollowUpAt");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_logs_waMessageId_key" ON "whatsapp_logs"("waMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_logs_idempotencyKey_key" ON "whatsapp_logs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "whatsapp_logs_orderId_idx" ON "whatsapp_logs"("orderId");

-- CreateIndex
CREATE INDEX "whatsapp_logs_recipientPhone_idx" ON "whatsapp_logs"("recipientPhone");

-- CreateIndex
CREATE INDEX "whatsapp_logs_templateName_idx" ON "whatsapp_logs"("templateName");

-- CreateIndex
CREATE INDEX "whatsapp_logs_status_idx" ON "whatsapp_logs"("status");

-- CreateIndex
CREATE INDEX "whatsapp_logs_createdAt_idx" ON "whatsapp_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationVersion" ADD CONSTRAINT "QuotationVersion_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationComplement" ADD CONSTRAINT "QuotationComplement_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusAuditLog" ADD CONSTRAINT "StatusAuditLog_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReminder" ADD CONSTRAINT "EventReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_convertedFromId_fkey" FOREIGN KEY ("convertedFromId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutItem" ADD CONSTRAINT "PayoutItem_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutItem" ADD CONSTRAINT "PayoutItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPoints" ADD CONSTRAINT "LoyaltyPoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_followup_logs" ADD CONSTRAINT "payment_followup_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
