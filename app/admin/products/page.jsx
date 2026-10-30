"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { LayoutGrid, PackageSearch, PackageX, Search, SearchX, Trash2, TriangleAlert, X } from "lucide-react";
import Icon from "@mdi/react";
import { mdiStoreCogOutline } from "@mdi/js";
import { getImagePath } from "@/app/utils/getImagePath";
import AppImage from "@/app/components/AppImage";
import { tracksStock } from "@/lib/stock";
import { LOW_STOCK_THRESHOLD } from "@/lib/statsMath";
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

const PAGE_SIZE_OPTIONS = [5, 10, 20];
const fa = (n) => Number(n).toLocaleString("fa-IR");

// آپشن‌های فیلتر دسته‌بندی (همان سه گزینهٔ قبلی؛ id دسته‌بندی به API می‌رود)
const CATEGORY_FILTERS = [
  { id: "all", name: "همه محصولات", short: "همه", icon: LayoutGrid },
  { id: "sewing-machine", name: "چرخ خیاطی", image: "/image/Sewing.png" },
  { id: "accessories", name: "لوازم جانبی", image: "/image/Needle.png" },
];

const formatPrice = (val) => {
  if (val == null || isNaN(val)) return "—";
  return fa(Math.round(Number(val)));
};

const getFinalPrice = (row) => {
  if (row.finalPrice != null && !isNaN(row.finalPrice)) return row.finalPrice;
  if (row.discount != null && !isNaN(row.discount)) return row.price * (1 - row.discount / 100);
  return row.price;
};

const getCategoryName = (row) => row.Category?.name || row.categoryName || "بدون دسته‌بندی";

// قیمت نهایی درشت و اگر تخفیف دارد زیرش قیمت اصلی خط‌خورده کنار چیپ درصد تخفیف
function Price({ row }) {
  const final = getFinalPrice(row);
  const hasDiscount = row.discount != null && Number(row.discount) > 0 && Number(final) < Number(row.price);
  return (
    <div className="leading-6">
      <p className="whitespace-nowrap font-bold text-gray-900">
        {formatPrice(final)} <span className="text-xs font-medium text-gray-500">تومان</span>
      </p>
      {hasDiscount && (
        <p className="mt-0.5 flex items-center gap-1.5">
          <span className="whitespace-nowrap text-xs text-gray-400 line-through">{formatPrice(row.price)}</span>
          <Chip tone="brand">{fa(row.discount)}٪ تخفیف</Chip>
        </p>
      )}
    </div>
  );
}

// موجودی با همان قاعدهٔ فروشگاه: بدون پیگیری موجودی («لوازم جانبی» یا خالی) فقط خط تیره (در کارت موبایل هیچ)؛ صفر قرمز؛ تا آستانهٔ داشبورد زرد؛ بقیه سبز
function StockChip({ row, quiet = false }) {
  if (!tracksStock(row)) return quiet ? null : <span className="text-gray-400">—</span>;
  const n = Number(row.stock);
  if (n <= 0) return <Chip tone="red" icon={PackageX}>ناموجود</Chip>;
  if (n <= LOW_STOCK_THRESHOLD) return <Chip tone="amber" icon={TriangleAlert}>{fa(n)} عدد</Chip>;
  return <Chip tone="green">{fa(n)} عدد</Chip>;
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]); // کل محصولات (بر اساس فیلتر دسته‌بندی)
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // فیلتر دسته‌بندی
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });
  const isMounted = useRef(true);

  const fetchProducts = useCallback(async (catFilter) => {
    setLoading(true);
    try {
      let categoryParam = undefined;
      if (catFilter === "sewing-machine") {
        categoryParam = "sewing-machine";
      } else if (catFilter === "accessories") {
        categoryParam = "accessories";
      }

      const { data } = await axios.get("/api/admin/products", {
        params: { category: categoryParam },
        headers: { "Cache-Control": "no-cache" },
      });

      if (isMounted.current) {
        if (Array.isArray(data)) {
          setProducts(
            data.filter((product) => product && typeof product === "object" && product.id)
          );
        } else {
          console.warn("Unexpected API response format:", data);
          setProducts([]);
        }
      }
    } catch (err) {
      console.error("Error fetching products:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
      toast.error("خطا در دریافت محصولات");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchProducts(categoryFilter);
    return () => {
      isMounted.current = false;
    };
  }, [categoryFilter, fetchProducts]);

  // جست‌وجو و صفحه‌بندی سمت کلاینت (API لیست کامل محصولات را برمی‌گرداند)
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => String(p.name ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // اگر بعد از حذف یا جست‌وجو، صفحه‌ی فعلی از تعداد صفحات بیشتر شد، به آخرین صفحه برگرد
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handlePageChange = (p) => setPage(p);
  const handlePageSizeChange = (ps) => { setPageSize(ps); setPage(1); };
  const handleDelete = (id, name = "") => setDeleteDialog({ open: true, id, name });
  const closeDialog = () => setDeleteDialog((d) => ({ ...d, open: false }));

  const handleFilterSelect = (filterId) => {
    setCategoryFilter(filterId);
    setPage(1); // ریست به صفحه اول
  };

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    closeDialog();
    try {
      await axios.delete("/api/admin/products", {
        data: { id },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("محصول با موفقیت حذف گردید.");
      fetchProducts(categoryFilter);
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(err.response?.data?.error || "مشکلی در حذف محصول به‌وجود آمد.");
    }
  };

  const isFirstLoad = loading && products.length === 0;
  const hasSearch = search.trim() !== "";

  const actions = (row) => (
    <RowActions
      editHref={`/admin/products/edit/${row.id}`}
      editLabel="ویرایش محصول"
      onDelete={() => handleDelete(row.id, row.name)}
      deleteLabel="حذف محصول"
    />
  );

  const imageOf = (row) => (row.image ? getImagePath(row.image) : null);

  const columns = [
    // ستون شناسه زیر xl پنهان است تا جدول در ۷۳۶ پیکسل (تبلت، یا لپ‌تاپ با منوی باز) بدون اسکرول افقی جا شود؛ دسته‌بندی زیر نام می‌آید
    { id: "id", label: "شناسه", th: "hidden w-16 xl:table-cell", td: "hidden tabular-nums text-gray-400 xl:table-cell", sk: "h-4 w-8", cell: (r) => fa(r.id) },
    {
      id: "name",
      label: "محصول",
      td: "w-full max-w-0",
      sk: "h-11 w-48 rounded-xl",
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Thumb src={imageOf(r)} alt={r.name || "محصول"} className="h-12 w-12" sizes="48px" />
          <div className="min-w-0">
            <p className="line-clamp-2 font-bold leading-6 text-gray-900">{r.name || "—"}</p>
            <p className="truncate text-xs text-gray-500">{getCategoryName(r)}</p>
          </div>
        </div>
      ),
    },
    { id: "price", label: "قیمت", sk: "h-8 w-28", cell: (r) => <Price row={r} /> },
    { id: "stock", label: "موجودی", sk: "h-6 w-20", cell: (r) => <StockChip row={r} /> },
    { id: "actions", label: "عملیات", th: "w-28", sk: "h-9 w-20 rounded-xl", cell: actions },
  ];

  const card = (r) => (
    <>
      <div className="flex gap-3">
        <Thumb src={imageOf(r)} alt={r.name || "محصول"} className="h-16 w-16" sizes="64px" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-bold leading-6 text-gray-900">{r.name || "—"}</h3>
          <div className="mt-1">
            <Chip tone="gray">{getCategoryName(r)}</Chip>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex flex-col items-start gap-1.5">
          <Price row={r} />
          <StockChip row={r} quiet />
        </div>
        {actions(r)}
      </div>
    </>
  );

  const activeFilter = CATEGORY_FILTERS.find((f) => f.id === categoryFilter);

  const toolbar = (
    <>
      <label className="relative block w-full sm:max-w-xs">
        <span className="sr-only">جستجوی محصول</span>
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="جستجو بر اساس نام محصول..."
          className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/70 ps-9 pe-9 text-sm text-gray-800 transition placeholder:text-gray-400 hover:border-gray-300 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {hasSearch && (
          <button
            type="button"
            aria-label="پاک کردن جستجو"
            onClick={() => setSearch("")}
            className="absolute end-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </label>

      <div role="group" aria-label="فیلتر دسته‌بندی" className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 [scrollbar-width:none]">
        {CATEGORY_FILTERS.map((f) => {
          const on = categoryFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => handleFilterSelect(f.id)}
              aria-label={f.name}
              className={`flex h-8 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 sm:px-3 ${
                on ? "bg-white text-brand-700 shadow-sm ring-1 ring-black/5" : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
              }`}
            >
              {f.image ? (
                <AppImage src={f.image} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
              ) : (
                <f.icon className="h-4 w-4" aria-hidden="true" />
              )}
              {f.short ? (
                <>
                  <span className="sm:hidden" aria-hidden="true">{f.short}</span>
                  <span className="hidden sm:inline" aria-hidden="true">{f.name}</span>
                </>
              ) : (
                f.name
              )}
            </button>
          );
        })}
      </div>
    </>
  );

  // سه حالت خالی: هیچ محصولی نیست، فیلتر دسته‌بندی چیزی نمی‌دهد، یا جست‌وجو چیزی پیدا نکرده
  let empty = null;
  if (!loading && total === 0) {
    if (hasSearch) {
      empty = (
        <EmptyState
          icon={SearchX}
          title="محصولی با این نام پیدا نشد"
          hint={`برای «${search.trim()}» نتیجه‌ای نیست. نوشتهٔ دیگری امتحان کنید یا جست‌وجو را پاک کنید.`}
          action={
            <button
              type="button"
              onClick={() => setSearch("")}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              پاک کردن جستجو
            </button>
          }
        />
      );
    } else if (categoryFilter !== "all") {
      empty = (
        <EmptyState
          icon={PackageSearch}
          title={`محصولی در «${activeFilter?.name}» نیست`}
          hint="این دسته‌بندی هنوز محصولی ندارد."
          action={
            <button
              type="button"
              onClick={() => handleFilterSelect("all")}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-gray-100 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              نمایش همهٔ محصولات
            </button>
          }
        />
      );
    } else {
      empty = (
        <EmptyState
          icon={PackageSearch}
          title="هنوز محصولی ثبت نشده"
          hint="اولین محصول را اضافه کنید تا در فروشگاه نمایش داده شود."
          action={<AddButton href="/admin/products/add" label="افزودن محصول" />}
        />
      );
    }
  }

  return (
    <>
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={closeDialog}
        onConfirm={confirmDelete}
        title="حذف محصول"
        confirmLabel="بله، حذف شود"
        icon={Trash2}
      >
        آیا مطمئن هستید که می‌خواهید محصول
        <strong className="mx-1 font-bold text-red-600">«{deleteDialog.name}»</strong>
        را حذف کنید؟
      </ConfirmDialog>

      <PageHeader
        icon={<Icon path={mdiStoreCogOutline} size="22px" />}
        title="مدیریت محصولات"
        loading={isFirstLoad}
        subtitleKey={total}
        subtitle={<><b>{fa(total)}</b> محصول یافت شد</>}
        actions={<AddButton href="/admin/products/add" label="افزودن محصول" loading={isFirstLoad} />}
      />

      <ListCard toolbar={toolbar}>
        {empty ?? (
          <>
            <DataTable
              label="فهرست محصولات"
              columns={columns}
              rows={pagedProducts}
              rowKey={(r) => r.id}
              renderCard={card}
              loading={isFirstLoad}
              busy={loading}
              skeletonRows={5}
            />
            {!isFirstLoad && (
              <Pagination
                page={currentPage}
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
