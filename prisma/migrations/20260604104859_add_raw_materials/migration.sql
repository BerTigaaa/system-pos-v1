-- CreateEnum
CREATE TYPE "RawMaterialMovementType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'OPNAME');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PRODUCT_DELETED';
ALTER TYPE "NotificationType" ADD VALUE 'PRODUCT_STATUS_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'STOCK_OPNAME_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_STATUS_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'CASH_FLOW_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'CASH_FLOW_DELETED';
ALTER TYPE "NotificationType" ADD VALUE 'EMPLOYEE_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'EMPLOYEE_STATUS_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'EMPLOYEE_PASSWORD_RESET';
ALTER TYPE "NotificationType" ADD VALUE 'USER_STATUS_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'USER_ROLE_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'SUPPLIER_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'SUPPLIER_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'SUPPLIER_DELETED';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "customer_name" TEXT;

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "module" TEXT NOT NULL,
    "actions" TEXT[],

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "buyPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_material_batches" (
    "id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "batch_code" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "buyPrice" DECIMAL(12,2) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplier_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_material_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_material_movements" (
    "id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "type" "RawMaterialMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stock_before" INTEGER NOT NULL,
    "stock_after" INTEGER NOT NULL,
    "buy_price" DECIMAL(12,2),
    "batch_id" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_material_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_module_key" ON "role_permissions"("role", "module");

-- CreateIndex
CREATE UNIQUE INDEX "raw_materials_sku_key" ON "raw_materials"("sku");

-- CreateIndex
CREATE INDEX "raw_materials_is_active_idx" ON "raw_materials"("is_active");

-- CreateIndex
CREATE INDEX "raw_materials_category_idx" ON "raw_materials"("category");

-- CreateIndex
CREATE INDEX "raw_material_batches_raw_material_id_idx" ON "raw_material_batches"("raw_material_id");

-- CreateIndex
CREATE INDEX "raw_material_batches_expiry_date_idx" ON "raw_material_batches"("expiry_date");

-- CreateIndex
CREATE INDEX "raw_material_batches_supplier_id_idx" ON "raw_material_batches"("supplier_id");

-- CreateIndex
CREATE INDEX "raw_material_movements_raw_material_id_idx" ON "raw_material_movements"("raw_material_id");

-- CreateIndex
CREATE INDEX "raw_material_movements_type_idx" ON "raw_material_movements"("type");

-- CreateIndex
CREATE INDEX "raw_material_movements_created_at_idx" ON "raw_material_movements"("created_at");

-- CreateIndex
CREATE INDEX "raw_material_movements_batch_id_idx" ON "raw_material_movements"("batch_id");

-- CreateIndex
CREATE INDEX "cash_flows_user_id_idx" ON "cash_flows"("user_id");

-- CreateIndex
CREATE INDEX "cash_flows_category_id_idx" ON "cash_flows"("category_id");

-- CreateIndex
CREATE INDEX "dining_tables_business_info_id_idx" ON "dining_tables"("business_info_id");

-- CreateIndex
CREATE INDEX "inventory_movements_user_id_idx" ON "inventory_movements"("user_id");

-- CreateIndex
CREATE INDEX "inventory_movements_supplier_id_idx" ON "inventory_movements"("supplier_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "orders_table_number_idx" ON "orders"("table_number");

-- CreateIndex
CREATE INDEX "refund_items_transaction_item_id_idx" ON "refund_items"("transaction_item_id");

-- CreateIndex
CREATE INDEX "refunds_processed_by_id_idx" ON "refunds"("processed_by_id");

-- CreateIndex
CREATE INDEX "shifts_opened_at_idx" ON "shifts"("opened_at");

-- CreateIndex
CREATE INDEX "stock_opname_items_product_id_idx" ON "stock_opname_items"("product_id");

-- CreateIndex
CREATE INDEX "stock_opnames_user_id_idx" ON "stock_opnames"("user_id");

-- CreateIndex
CREATE INDEX "transactions_shift_id_idx" ON "transactions"("shift_id");

-- AddForeignKey
ALTER TABLE "raw_material_batches" ADD CONSTRAINT "raw_material_batches_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_batches" ADD CONSTRAINT "raw_material_batches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_movements" ADD CONSTRAINT "raw_material_movements_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_movements" ADD CONSTRAINT "raw_material_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_movements" ADD CONSTRAINT "raw_material_movements_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_movements" ADD CONSTRAINT "raw_material_movements_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "raw_material_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
