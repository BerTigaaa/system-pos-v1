import { PageHeader } from "@/components/ui/page-header";
import { AuditLogTable } from "@/features/audit/components/audit-log-table";

export default function AuditLogsPage() {
  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Riwayat aktivitas sistem" />
      <AuditLogTable />
    </div>
  );
}
