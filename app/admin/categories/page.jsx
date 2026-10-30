"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Shapes, Trash2 } from "lucide-react";
import Icon from "@mdi/react";
import { mdiShapeOutline } from "@mdi/js";
import PageHeader from "@/app/admin/_shell/PageHeader";
import ConfirmDialog from "@/app/admin/_shell/ConfirmDialog";
import ListCard from "@/app/admin/_list/ListCard";
import DataTable from "@/app/admin/_list/DataTable";
import Pagination from "@/app/admin/_list/Pagination";
import AddButton from "@/app/admin/_list/AddButton";
import EmptyState from "@/app/admin/_list/EmptyState";
import Thumb from "@/app/admin/_list/Thumb";
import Chip from "@/app/admin/_list/Chip";
import { RowActions } from "@/app/admin/_list/IconAction";

const PAGE_SIZE_OPTIONS = [3, 5, 10];
const fa = (n) => Number(n).toLocaleString("fa-IR");

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(3);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });
  const isMounted = useRef(true);

  const fetchCategories = useCallback(async (pg, ps) => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/categories");

      // اصلاح مسیر تصویر (منطق اصلی دست نخورده)
      const categoriesWithFixedImages = data.map((cat) => ({
        ...cat,
        image: cat.image
          ? cat.image.startsWith("/image/")
            ? cat.image
            : `/image/${cat.image}`
          : null,
      }));

      // pagination سمت کلاینت (چون API categories pagination ندارد)
      if (isMounted.current) {
        setTotal(categoriesWithFixedImages.length);
        setTotalPages(Math.max(1, Math.ceil(categoriesWithFixedImages.length / ps)));
        const start = (pg - 1) * ps;
        setCategories(categoriesWithFixedImages.slice(start, start + ps));
      }
    } catch (err) {
      console.error(err);
      toast.error("خطا در دریافت دسته‌بندی‌ها");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchCategories(page, pageSize);
    return () => { isMounted.current = false; };
  }, [page, pageSize, fetchCategories]);

  const handlePageChange     = (p)  => setPage(p);
  const handlePageSizeChange = (ps) => { setPageSize(ps); setPage(1); };

  const deleteCategory = (id, name = "") => {
    setDeleteDialog({ open: true, id, name });
  };
  const closeDialog = () => setDeleteDialog((d) => ({ ...d, open: false }));

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    closeDialog();

    try {
      await axios.delete("/api/admin/categories", {
        data: { id },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("دسته‌بندی با موفقیت حذف گردید.");
      // اگر آخرین ردیف صفحهٔ آخر حذف شد به صفحهٔ قبل برگرد (مثل بنرها)، وگرنه صفحهٔ خالی می‌ماند
      const targetPage = Math.min(page, Math.max(1, Math.ceil((total - 1) / pageSize)));
      if (targetPage !== page) setPage(targetPage);
      else fetchCategories(page, pageSize);
    } catch (err) {
      console.error(err);
      toast.error("مشکلی در حذف دسته‌بندی به‌وجود آمد.");
    }
  };

  const isFirstLoad = loading && categories.length === 0;

  const actions = (row) => (
    <RowActions
      editHref={`/admin/categories/edit/${row.id}`}
      editLabel="ویرایش دسته‌بندی"
      onDelete={() => deleteCategory(row.id, row.name)}
      deleteLabel="حذف دسته‌بندی"
    />
  );

  const slug = (r) => (r.slug ? <Chip tone="gray"><span dir="ltr">{r.slug}</span></Chip> : "—");

  const columns = [
    { id: "id", label: "شناسه", th: "w-20", td: "tabular-nums text-gray-400", sk: "h-4 w-8", cell: (r) => fa(r.id) },
    {
      id: "name",
      label: "دسته‌بندی",
      sk: "h-11 w-48 rounded-xl",
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={r.image} alt={r.name || "دسته‌بندی"} className="h-11 w-11" sizes="48px" />
          <span className="truncate font-bold text-gray-900">{r.name || "—"}</span>
        </div>
      ),
    },
    { id: "slug", label: "نشانی (slug)", sk: "h-6 w-28", cell: slug },
    { id: "actions", label: "عملیات", th: "w-28", sk: "h-9 w-20 rounded-xl", cell: actions },
  ];

  const card = (r) => (
    <>
      <div className="flex items-center gap-3">
        <Thumb src={r.image} alt={r.name || "دسته‌بندی"} className="h-14 w-14" sizes="56px" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-gray-900">{r.name || "—"}</h3>
          <div className="mt-1.5">{slug(r)}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">شناسه {fa(r.id)}</span>
        {actions(r)}
      </div>
    </>
  );

  return (
    <>
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={closeDialog}
        onConfirm={confirmDelete}
        title="حذف دسته‌بندی"
        confirmLabel="بله، حذف شود"
        icon={Trash2}
      >
        آیا مطمئن هستید که می‌خواهید دسته‌بندی
        <strong className="mx-1 font-bold text-red-600">«{deleteDialog.name}»</strong>
        را حذف کنید؟
      </ConfirmDialog>

      <PageHeader
        icon={<Icon path={mdiShapeOutline} size="22px" />}
        title="مدیریت دسته‌بندی‌ها"
        loading={isFirstLoad}
        subtitleKey={total}
        subtitle={<><b>{fa(total)}</b> دسته‌بندی یافت شد</>}
        actions={<AddButton href="/admin/categories/add" label="افزودن دسته‌بندی" loading={isFirstLoad} />}
      />

      <ListCard>
        {!loading && total === 0 ? (
          <EmptyState
            icon={Shapes}
            title="هنوز دسته‌بندی‌ای ثبت نشده"
            hint="دسته‌بندی‌ها محصولات را در فروشگاه گروه‌بندی می‌کنند. اولین دسته‌بندی را اضافه کنید."
            action={<AddButton href="/admin/categories/add" label="افزودن دسته‌بندی" />}
          />
        ) : (
          <>
            <DataTable
              label="فهرست دسته‌بندی‌ها"
              columns={columns}
              rows={categories}
              rowKey={(r) => r.id}
              renderCard={card}
              loading={isFirstLoad}
              busy={loading}
            />
            {!isFirstLoad && (
              <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZE_OPTIONS}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </>
        )}
      </ListCard>
    </>
  );
}
