"use client";

import { Skeleton, Card, Space } from "antd";

export type LoadingSkeletonProps = {
  type?: "table" | "card" | "form" | "stat";
  rows?: number;
};

export function LoadingSkeleton({
  type = "table",
  rows = 5,
}: LoadingSkeletonProps) {
  if (type === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (type === "stat") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Space orientation="vertical" className="w-full">
              <Skeleton.Input active size="small" block />
              <Skeleton.Input active size="large" block />
            </Space>
          </Card>
        ))}
      </div>
    );
  }

  if (type === "form") {
    return (
      <Card>
        <Space orientation="vertical" className="w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton.Input active size="small" block className="mb-1" />
              <Skeleton.Input active size="large" block />
            </div>
          ))}
        </Space>
      </Card>
    );
  }

  return (
    <Card>
      <Skeleton active paragraph={{ rows }} />
    </Card>
  );
}
