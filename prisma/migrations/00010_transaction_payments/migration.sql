-- CreateTable transaction_payments
CREATE TABLE "transaction_payments" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT,
    "change_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_payments_transaction_id_idx" ON "transaction_payments"("transaction_id");

-- AddForeignKey
ALTER TABLE "transaction_payments" ADD CONSTRAINT "transaction_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
