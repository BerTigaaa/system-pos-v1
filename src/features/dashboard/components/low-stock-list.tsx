type Props = {
  items: { id: string; name: string; sku: string; stock: number; min_stock: number }[];
};

export function LowStockList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-8">
        Semua stok aman ✅
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
      {items.map((p) => {
        const isOut = p.stock === 0;
        return (
          <div
            key={p.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
              <div className="text-xs text-gray-400">{p.sku}</div>
            </div>
            <div
              className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                isOut
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {p.stock} / {p.min_stock}
            </div>
          </div>
        );
      })}
    </div>
  );
}
