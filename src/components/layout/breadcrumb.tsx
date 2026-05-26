"use client";

import { Breadcrumb as AntBreadcrumb } from "antd";
import type { BreadcrumbProps } from "antd";

export function Breadcrumb(props: BreadcrumbProps) {
  return <AntBreadcrumb {...props} />;
}
