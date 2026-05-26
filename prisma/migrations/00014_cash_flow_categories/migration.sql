-- CreateTable cash_flow_categories
CREATE TABLE "cash_flow_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_flow_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_flow_categories_name_type_key" ON "cash_flow_categories"("name", "type");
