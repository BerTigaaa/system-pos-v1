"use client";

import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd";

export type ButtonProps = AntButtonProps & {
  loading?: boolean;
};

export function Button(props: ButtonProps) {
  return <AntButton {...props} />;
}
