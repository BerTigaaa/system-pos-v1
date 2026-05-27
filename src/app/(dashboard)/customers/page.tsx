import { PageHeader } from "@/components/ui/page-header";
import { CustomerTable } from "@/features/customers/components/customer-table";

export default function CustomersPage() {
  return (
    <div>
      <PageHeader title="Pelanggan" subtitle="Kelola data pelanggan" />
      <CustomerTable />
    </div>
  );
}
