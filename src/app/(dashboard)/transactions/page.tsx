import { PageHeader } from "@/components/ui/page-header";
import { TransactionTable } from "@/features/transactions/components/transaction-table";

export default function TransactionsPage() {
  return (
    <div>
      <PageHeader title="Transaksi" subtitle="Riwayat transaksi & refund" />
      <TransactionTable />
    </div>
  );
}
