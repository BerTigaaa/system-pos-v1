"use client";

import { Modal as AntModal } from "antd";
import type { ModalProps } from "antd";

export type AppModalProps = ModalProps & {
  loading?: boolean;
};

export function AppModal({ loading, children, ...props }: AppModalProps) {
  return (
    <AntModal
      destroyOnHidden
      confirmLoading={loading}
      {...props}
    >
      {children}
    </AntModal>
  );
}
