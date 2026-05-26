-- CreateTable stock_opnames
CREATE TABLE "stock_opnames" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notes" TEXT,
    "is_adjusted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adjusted_at" TIMESTAMP(3),

    CONSTRAINT "stock_opnames_pkey" PRIMARY KEY ("id")
);

-- CreateTable stock_opname_items
CREATE TABLE "stock_opname_items" (
    "id" TEXT NOT NULL,
    "opname_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "system_stock" INTEGER NOT NULL,
    "physical_stock" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_opname_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_opname_items_opname_id_idx" ON "stock_opname_items"("opname_id");

-- AddForeignKey
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_opname_id_fkey" FOREIGN KEY ("opname_id") REFERENCES "stock_opnames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
