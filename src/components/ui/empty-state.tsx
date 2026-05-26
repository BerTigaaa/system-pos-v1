"use client";

import { Empty, Button, Space, Typography } from "antd";

const { Text } = Typography;

export type EmptyStateProps = {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
};

export function EmptyState({
  title = "Tidak ada data",
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Empty
        description={
          <Space orientation="vertical" size={4} className="text-center">
            <Text strong>{title}</Text>
            {description && (
              <Text type="secondary">{description}</Text>
            )}
          </Space>
        }
      />
      {actionText && onAction && (
        <Button type="primary" onClick={onAction} className="mt-4">
          {actionText}
        </Button>
      )}
    </div>
  );
}
