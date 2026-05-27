import { PageHeader } from "@/components/ui/page-header";
import { ShiftsClient } from "./client";

export default function ShiftsPage() {
  return (
    <div>
      <PageHeader title="Shift" subtitle="Kelola buka & tutup shift" />
      <ShiftsClient />
    </div>
  );
}
