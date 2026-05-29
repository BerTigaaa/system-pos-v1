"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Space, Select, DatePicker, Modal, Form, Input, InputNumber, Tag, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useToast } from "@/components/ui/toast";
import { DataTable } from "@/components/ui/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { getCashFlows, getCashFlowCategories, createCashFlow, updateCashFlow, deleteCashFlow } from "../actions";
import type { CashFlowItem, CashFlowCategoryItem, CashFlowFormData } from "../types";

const { RangePicker } = DatePicker;

export function CashFlowList({ flowType }: { flowType: "IN" | "OUT" }) {
  const toast = useToast();
  const { can } = usePermissions();
  const [data, setData] = useState<CashFlowItem[]>([]);
  const [categories, setCategories] = useState<CashFlowCategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState<string>();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CashFlowItem | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async (p = page, ps = pageSize) => {
    setLoading(true);
    const res = await getCashFlows({
      type: flowType,
      categoryId: categoryFilter,
      dateFrom: dateRange?.[0],
      dateTo: dateRange?.[1],
      page: p,
      pageSize: ps,
    });
    if (res.success) {
      setData(res.data as CashFlowItem[]);
      setTotal(res.total);
    } else {
      toast.error(res.error?.message ?? "Gagal memuat data");
    }
    setLoading(false);
  }, [page, pageSize, flowType, categoryFilter, dateRange]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getCashFlowCategories(flowType).then((res) => {
      if (res.success) setCategories(res.data as CashFlowCategoryItem[]);
    });
  }, [flowType]);

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: flowType, date: new Date().toISOString().split("T")[0] });
    setModalOpen(true);
  }

  function openEdit(record: CashFlowItem) {
    setEditing(record);
    form.setFieldsValue({
      type: record.type,
      categoryId: record.category.id,
      amount: record.amount,
      description: record.description,
      reference: record.reference ?? "",
      date: new Date(record.date).toISOString().split("T")[0],
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const res = editing
      ? await updateCashFlow(editing.id, values as CashFlowFormData)
      : await createCashFlow(values as CashFlowFormData);

    if (res.success) {
      toast.success(editing ? "Diperbarui" : "Berhasil disimpan");
      setModalOpen(false);
      setEditing(null);
      load();
    } else {
      toast.error(res.error?.message ?? "Gagal");
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteCashFlow(id);
    if (res.success) { toast.success("Dihapus"); load(); }
    else toast.error(res.error?.message ?? "Gagal");
  }

  const columns = [
    {
      title: "Tanggal",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (v: Date) => new Date(v).toLocaleDateString("id-ID"),
    },
    {
      title: "Kategori",
      dataIndex: ["category", "name"],
      key: "category",
      width: 150,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Deskripsi",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Referensi",
      dataIndex: "reference",
      key: "reference",
      width: 120,
      render: (v: string | null) => v ?? "-",
    },
    {
      title: "Jumlah",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      align: "right" as const,
      render: (v: number) => (
        <span className={`font-semibold ${flowType === "IN" ? "text-green-600" : "text-red-500"}`}>
          {flowType === "IN" ? "+" : "-"}Rp {v.toLocaleString("id")}
        </span>
      ),
    },
    {
      title: "Oleh",
      dataIndex: ["user", "name"],
      key: "user",
      width: 130,
    },
    ...(can("finance", "edit") || can("finance", "delete")
      ? [
          {
            title: "Aksi",
            key: "action",
            width: 100,
            render: (_: unknown, r: CashFlowItem) => (
              <Space size="small">
                {can("finance", "edit") && (
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                )}
                {can("finance", "delete") && (
                  <Popconfirm title="Hapus data ini?" onConfirm={() => handleDelete(r.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            allowClear
            placeholder="Kategori"
            style={{ width: 160 }}
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
          <RangePicker
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setDateRange([dateStrings[0], dateStrings[1]]);
              } else {
                setDateRange(null);
              }
              setPage(1);
            }}
          />
        </div>
        {can("finance", "create") && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tambah {flowType === "IN" ? "Kas Masuk" : "Kas Keluar"}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal
        title={editing ? `Edit ${flowType === "IN" ? "Kas Masuk" : "Kas Keluar"}` : `Tambah ${flowType === "IN" ? "Kas Masuk" : "Kas Keluar"}`}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="categoryId"
            label="Kategori"
            rules={[{ required: true, message: "Pilih kategori" }]}
          >
            <Select
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              placeholder="Pilih kategori"
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Jumlah"
            rules={[{ required: true, message: "Masukkan jumlah" }]}
          >
            <InputNumber
              min={1}
              className="!w-full"
              prefix="Rp"
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="Deskripsi"
            rules={[{ required: true, message: "Deskripsi wajib diisi" }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="reference"
            label="Referensi (opsional)"
          >
            <Input placeholder="No. nota, invoice, dll" />
          </Form.Item>
          <Form.Item
            name="date"
            label="Tanggal"
            rules={[{ required: true, message: "Pilih tanggal" }]}
          >
            <Input type="date" className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
