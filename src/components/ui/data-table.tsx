"use client";

import { Table } from "antd";
import type { TableProps } from "antd";
import React from "react";

export type DataTableProps<T> = TableProps<T> & {
  loading?: boolean;
};

const DataTableInner = <T extends object>({ loading, ...props }: DataTableProps<T>) => (
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

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;
