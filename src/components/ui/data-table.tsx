"use client";

import { Table } from "antd";
import type { TableProps } from "antd";

export type DataTableProps<T> = TableProps<T> & {
  loading?: boolean;
};

export function DataTable<T extends object>({
  loading,
  ...props
}: DataTableProps<T>) {
  return (
    <Table<T>
      loading={loading}
      scroll={{ x: "max-content" }}
      pagination={{
        showSizeChanger: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} dari ${total}`,
        pageSizeOptions: ["10", "20", "50"],
        defaultPageSize: 10,
        ...props.pagination,
      }}
      {...props}
    />
  );
}
