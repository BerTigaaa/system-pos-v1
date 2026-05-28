-- Add paid_at column to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);

-- Drop customers table if it still exists
DROP TABLE IF EXISTS "customers" CASCADE;

-- Drop customer_id from transactions (if not already done)
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_customer_id_fkey";
DROP INDEX IF EXISTS "transactions_customer_id_idx";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "customer_id";
