-- CreateTable cash_flows
CREATE TABLE "cash_flows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cash_flows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_flows_type_idx" ON "cash_flows"("type");

-- CreateIndex
CREATE INDEX "cash_flows_date_idx" ON "cash_flows"("date");

-- AddForeignKey
ALTER TABLE "cash_flows" ADD CONSTRAINT "cash_flows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flows" ADD CONSTRAINT "cash_flows_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cash_flow_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
