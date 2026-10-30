"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { ImagePlus, Trash2 } from "lucide-react";
import Icon from "@mdi/react";
import { mdiImageSearchOutline } from "@mdi/js";
import { getImagePath } from "@/app/utils/getImagePath";
import PageHeader from "@/app/admin/_shell/PageHeader";
import ConfirmDialog from "@/app/admin/_shell/ConfirmDialog";
import ListCard from "@/app/admin/_list/ListCard";
import DataTable from "@/app/admin/_list/DataTable";
import Pagination from "@/app/admin/_list/Pagination";
import AddButton from "@/app/admin/_list/AddButton";
import EmptyState from "@/app/admin/_list/EmptyState";
import Thumb from "@/app/admin/_list/Thumb";
import { RowActions } from "@/app/admin/_list/IconAction";

const PAGE_SIZE_OPTIONS = [3, 5, 10];
const fa = (n) => Number(n).toLocaleString("fa-IR");

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: "" });
  const isMounted = useRef(true);

  const fetchBanners = useCallback(async (pg, ps) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();

      // pagination سمت کلاینت (چون API banners pagination ندارد)
      if (isMounted.current) {
        const list = Array.isArray(data) ? data : [];
        const start = (pg - 1) * ps;
        setTotal(list.length);
        setTotalPages(Math.max(1, Math.ceil(list.length / ps)));
        setBanners(list.slice(start, start + ps));
      }
    } catch (err) {
      console.error("Error fetching banners:", err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchBanners(page, pageSize);
    return () => { isMounted.current = false; };
  }, [page, pageSize, fetchBanners]);

  const handlePageChange = (p) => setPage(p);
  const handlePageSizeChange = (ps) => { setPageSize(ps); setPage(1); };
  const handleDelete = (id, title = "") => setDeleteDialog({ open: true, id, title });
  const closeDialog = () => setDeleteDialog((d) => ({ ...d, open: false }));

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    closeDialog();
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error();
      toast.success("بنر با موفقیت حذف گردید.");
      const newTotal = total - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
      const targetPage = page > newTotalPages ? newTotalPages : page;
      if (targetPage !== page) setPage(targetPage);
      else fetchBanners(page, pageSize);
    } catch {
      toast.error("مشکلی در حذف بنر به‌وجود آمد.");
    }
  };

  const isFirstLoad = loading && banners.length === 0;

  const actions = (row) => (
    <RowActions
      editHref={`/admin/banners/edit/${row.id}`}
      editLabel="ویرایش بنر"
      onDelete={() => handleDelete(row.id, row.title)}
      deleteLabel="حذف بنر"
    />
  );

  const columns = [
    { id: "id", label: "شناسه", th: "w-20", td: "tabular-nums text-gray-400", sk: "h-4 w-8", cell: (r) => fa(r.id) },
    {
      id: "img",
      label: "تصویر",
      th: "w-36",
      sk: "h-14 w-24 rounded-xl",
      cell: (r) => <Thumb src={r.img ? getImagePath(r.img) : null} alt={r.title || "بنر"} className="h-14 w-24" sizes="96px" />,
    },
    { id: "title", label: "عنوان", td: "min-w-44 font-bold leading-6 text-gray-900", sk: "h-4 w-40", cell: (r) => r.title || "—" },
    {
      id: "desc",
      label: "توضیحات",
      td: "w-full max-w-0",
      sk: "h-4 w-56",
      cell: (r) => <p className="line-clamp-2 leading-6 text-gray-500">{r.desc || "—"}</p>,
    },
    { id: "actions", label: "عملیات", th: "w-28", sk: "h-9 w-20 rounded-xl", cell: actions },
  ];

  const card = (r) => (
    <>
      <div className="flex gap-3">
        <Thumb src={r.img ? getImagePath(r.img) : null} alt={r.title || "بنر"} className="h-16 w-28" sizes="112px" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-bold leading-6 text-gray-900">{r.title || "—"}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500">{r.desc || "—"}</p>
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
        title="حذف بنر"
        confirmLabel="بله، حذف شود"
        icon={Trash2}
      >
        آیا مطمئن هستید که می‌خواهید بنر
        <strong className="mx-1 font-bold text-red-600">«{deleteDialog.title}»</strong>
        را حذف کنید؟
      </ConfirmDialog>

      <PageHeader
        icon={<Icon path={mdiImageSearchOutline} size="22px" />}
        title="مدیریت بنرها"
        loading={isFirstLoad}
        subtitleKey={total}
        subtitle={<><b>{fa(total)}</b> بنر یافت شد</>}
        actions={<AddButton href="/admin/banners/add" label="افزودن بنر" loading={isFirstLoad} />}
      />

      <ListCard>
        {!loading && total === 0 ? (
          <EmptyState
            icon={ImagePlus}
            title="هنوز بنری ثبت نشده"
            hint="بنرها در بالای صفحهٔ اول فروشگاه نمایش داده می‌شوند. اولین بنر را اضافه کنید."
            action={<AddButton href="/admin/banners/add" label="افزودن بنر" />}
          />
        ) : (
          <>
            <DataTable
              label="فهرست بنرها"
              columns={columns}
              rows={banners}
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
