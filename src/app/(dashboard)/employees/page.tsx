import { PageHeader } from "@/components/ui/page-header";
import { EmployeeTable } from "@/features/employees/components/employee-table";

export default function EmployeesPage() {
  return (
    <div>
      <PageHeader title="Karyawan" subtitle="Kelola akun karyawan" />
      <EmployeeTable />
    </div>
  );
}
