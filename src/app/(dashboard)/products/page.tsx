import { PageHeader } from "@/components/ui/page-header";
import { ProductTable } from "@/features/products/components/product-table";

export default function ProductsPage() {
  return (
    <div>
      <PageHeader title="Produk" subtitle="Kelola produk & kategori" />
      <ProductTable />
    </div>
  );
}
