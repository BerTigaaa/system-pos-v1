"use client";

import { Breadcrumb, Space } from "antd";
import type { BreadcrumbProps } from "antd";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  breadcrumb?: BreadcrumbProps["items"];
};

export function PageHeader({
  title,
  subtitle,
  extra,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumb && (
        <Breadcrumb items={breadcrumb} className="mb-2" />
      )}
      <div className="flex items-center justify-between">
        <Space orientation="vertical" size={0}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <span className="text-gray-500 text-sm">{subtitle}</span>
          )}
        </Space>
        {extra && <Space>{extra}</Space>}
      </div>
    </div>
  );
}
