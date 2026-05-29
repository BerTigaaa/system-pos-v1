export const actionLabels: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Buat Baru", color: "green" },
  UPDATE: { label: "Ubah Data", color: "blue" },
  DELETE: { label: "Hapus", color: "red" },
  ACTIVATE: { label: "Aktifkan", color: "green" },
  DEACTIVATE: { label: "Nonaktifkan", color: "orange" },
  ADJUST_STOCK: { label: "Sesuaikan Stok", color: "blue" },
  ACTIVATE_USER: { label: "Aktifkan Akun", color: "green" },
  DEACTIVATE_USER: { label: "Nonaktifkan Akun", color: "orange" },
  UPDATE_USER_ROLE: { label: "Ubah Hak Akses", color: "purple" },
  EMPLOYEE_CREATED: { label: "Tambah Karyawan", color: "green" },
  EMPLOYEE_UPDATED: { label: "Ubah Karyawan", color: "blue" },
  EMPLOYEE_TOGGLED: { label: "Aktif/Nonaktif Karyawan", color: "orange" },
  EMPLOYEE_PASSWORD_RESET: { label: "Reset Password", color: "purple" },
  CASH_IN_CREATED: { label: "Tambah Kas Masuk", color: "green" },
  CASH_OUT_CREATED: { label: "Tambah Kas Keluar", color: "red" },
  CASH_FLOW_UPDATED: { label: "Ubah Catatan Keuangan", color: "blue" },
  CASH_FLOW_DELETED: { label: "Hapus Catatan Keuangan", color: "red" },
  TRANSACTION_REFUNDED: { label: "Refund Transaksi", color: "orange" },
};

export const moduleLabels: Record<string, string> = {
  products: "Produk",
  categories: "Kategori",
  inventory: "Inventori",
  admin: "Admin",
  employees: "Karyawan",
  finance: "Keuangan",
  transactions: "Transaksi",
};

export function getActionLabel(action: string): { label: string; color: string } {
  return actionLabels[action] ?? { label: action, color: "default" };
}

export function getModuleLabel(module: string): string {
  return moduleLabels[module] ?? module;
}
