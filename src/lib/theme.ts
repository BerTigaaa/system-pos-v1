import type { ThemeConfig } from "antd";

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: "#2563EB",
    colorSuccess: "#16A34A",
    colorWarning: "#D97706",
    colorError: "#DC2626",
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    colorBgLayout: "#F8FAFC",
    colorBgContainer: "#FFFFFF",
    colorText: "#0F172A",
    colorTextSecondary: "#64748B",
    colorBorder: "#E2E8F0",
    colorFillAlter: "#F1F5F9",
  },
  components: {
    Button: { controlHeight: 40, controlHeightLG: 48, controlHeightSM: 32, fontWeight: 500 },
    Table: { headerBg: "#F8FAFC", headerColor: "#64748B", headerBorderRadius: 8, rowHoverBg: "#F1F5F9" },
    Card: { borderRadius: 12 },
    Modal: { borderRadius: 12 },
    Drawer: { borderRadius: 12 },
    Input: { controlHeight: 40 },
    Select: { controlHeight: 40 },
    Menu: { itemBorderRadius: 8, itemBg: "transparent" },
    Form: {
      itemMarginBottom: 20,
      verticalLabelPadding: "0 0 6px",
    },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: "#3B82F6",
    colorSuccess: "#22C55E",
    colorWarning: "#F59E0B",
    colorError: "#EF4444",
    borderRadius: 8,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    colorBgLayout: "#0F172A",
    colorBgContainer: "#1E293B",
    colorText: "#F1F5F9",
    colorTextSecondary: "#94A3B8",
    colorBorder: "#334155",
    colorFillAlter: "#1E293B",
  },
  components: {
    Button: { controlHeight: 40, controlHeightLG: 48, controlHeightSM: 32, fontWeight: 500 },
    Table: { headerBg: "#1E293B", headerColor: "#94A3B8", headerBorderRadius: 8, rowHoverBg: "#334155" },
    Card: { borderRadius: 12 },
    Modal: { borderRadius: 12 },
    Drawer: { borderRadius: 12 },
    Input: { controlHeight: 40 },
    Select: { controlHeight: 40 },
    Menu: { itemBorderRadius: 8, itemBg: "transparent" },
    Form: {
      itemMarginBottom: 20,
      verticalLabelPadding: "0 0 6px",
    },
  },
};
