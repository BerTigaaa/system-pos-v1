-- CreateTable
CREATE TABLE "dining_tables" (
    "id" TEXT NOT NULL,
    "business_info_id" TEXT NOT NULL,
    "table_number" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_business_info_id_table_number_key" ON "dining_tables"("business_info_id", "table_number");

-- AddForeignKey
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_business_info_id_fkey" FOREIGN KEY ("business_info_id") REFERENCES "business_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
