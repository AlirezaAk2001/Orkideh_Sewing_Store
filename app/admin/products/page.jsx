"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";
import Link from "next/link";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { getImagePath } from "@/app/utils/getImagePath";
import Icon from '@mdi/react';
import {
  mdiStoreCogOutline,
  mdiStorePlusOutline,
  mdiDeleteCircleOutline,
  mdiCloseCircleOutline,
  mdiTrashCanOutline,
  mdiPen,
  mdiChevronLeft,
  mdiChevronRight,
  mdiMagnify,
  mdiClose,
  mdiFilterVariant,
  mdiCheck,
  mdiPackageVariant,
} from '@mdi/js';

const PAGE_SIZE_OPTIONS = [5, 10, 20];

// آپشن‌های فیلتر دسته‌بندی
const CATEGORY_FILTERS = [
  { id: "all", name: "همه محصولات", icon: null },
  { id: "sewing-machine", name: "چرخ خیاطی", image: "/image/Sewing.png" },
  { id: "accessories", name: "لوازم جانبی", image: "/image/Needle.png" },
];

function CustomPagination({ page, totalPages, pageSize, total, onPageChange, onPageSizeChange }) {
  const fa = (n) => Number(n).toLocaleString("fa-IR");

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <Box
      dir="rtl"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1,
        px: 2,
        py: 1.5,
        borderTop: "1px solid #e2e8f0",
        background: "#fff",
        fontFamily: "Vazirmatn, sans-serif",
        fontSize: ".82rem",
        color: "#64748b",
        userSelect: "none",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <span>تعداد در صفحه:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            fontFamily: "Vazirmatn, sans-serif",
            fontSize: ".82rem",
            color: "#475569",
            height: 30,
            padding: "0 28px 0 10px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            background: "#fff",
            cursor: "pointer",
            outline: "none",
            appearance: "auto",
          }}
          onMouseOver={(e) => e.target.style.borderColor = "#94a3b8"}
          onMouseOut={(e) => e.target.style.borderColor = "#e2e8f0"}
          onFocus={(e) => e.target.style.borderColor = "#6366f1"}
          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {fa(opt)}
            </option>
          ))}
        </select>
      </Box>

      <Box sx={{ color: "#475569", fontWeight: 500 }}>
        {total === 0 ? "محصولی یافت نشد" : `صفحه ${fa(page)} از ${fa(totalPages)}`}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconButton size="small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          sx={{
            color: page <= 1 ? "#cbd5e1" : "#475569",
            "&:hover:not(:disabled)": { background: "rgba(99,102,241,.1)", color: "#6366f1" },
          }}>
          <Icon path={mdiChevronRight} size={0.9} />
        </IconButton>

        {pageNumbers.map((item, idx) =>
          item === "..." ? (
            <Box key={`e-${idx}`} sx={{ px: 0.5, color: "#94a3b8" }}>…</Box>
          ) : (
            <IconButton key={item} size="small" onClick={() => onPageChange(item)}
              sx={{
                minWidth: 30, height: 30,
                borderRadius: "8px",
                fontFamily: "Vazirmatn, sans-serif",
                fontSize: ".82rem",
                fontWeight: item === page ? 700 : 400,
                color: item === page ? "#fff" : "#475569",
                background: item === page
                  ? "linear-gradient(135deg,#6366f1,#4f46e5)"
                  : "transparent",
                boxShadow: item === page ? "0 2px 8px rgba(99,102,241,.35)" : "none",
                transition: "all .18s ease",
                "&:hover": item !== page
                  ? { background: "rgba(99,102,241,.1)", color: "#6366f1" } : {},
              }}>
              {fa(item)}
            </IconButton>
          )
        )}
        <IconButton size="small" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          sx={{
            color: page >= totalPages ? "#cbd5e1" : "#475569",
            "&:hover:not(:disabled)": { background: "rgba(99,102,241,.1)", color: "#6366f1" },
          }}>
          <Icon path={mdiChevronLeft} size={0.9} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]); // کل محصولات (بر اساس فیلتر دسته‌بندی)
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // فیلتر دسته‌بندی
  const [filterAnchorEl, setFilterAnchorEl] = useState(null); // منوی فیلتر
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });
  const isMounted = useRef(true);

  const openFilter = Boolean(filterAnchorEl);

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

  // مدیریت فیلتر
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (filterId) => {
    setCategoryFilter(filterId);
    setPage(1); // ریست به صفحه اول
    handleFilterClose();
  };

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ open: false, id: null, name: "" });
    try {
      await axios.delete("/api/admin/products", {
        data: { id },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("محصول با موفقیت حذف گردید.");
      fetchProducts(categoryFilter);
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("مشکلی در حذف محصول به‌وجود آمد.");
    }
  };

  const columns = [
    { id: "id", label: "شناسه", width: 80 },
    { id: "name", label: "نام محصول", width: 180 },
    { id: "price", label: "قیمت", width: 110 },
    { id: "finalPrice", label: "قیمت نهایی", width: 110 },
    { id: "stock", label: "موجودی", width: 90 },
    { id: "category", label: "دسته‌بندی", width: 140 },
    { id: "discount", label: "تخفیف", width: 90 },
    { id: "image", label: "تصویر", width: 90 },
    { id: "actions", label: "عملیات", width: 140 },
  ];

  const isFirstLoad = loading && products.length === 0;

  const formatPrice = (val) => {
    if (val == null || isNaN(val)) return "—";
    return Number(val).toLocaleString("fa-IR");
  };

  const getFinalPrice = (row) => {
    if (row.finalPrice != null && !isNaN(row.finalPrice)) return row.finalPrice;
    if (row.discount != null && !isNaN(row.discount)) return row.price * (1 - row.discount / 100);
    return row.price;
  };

  const getCategoryName = (row) => {
    return row.Category?.name || row.categoryName || "بدون دسته‌بندی";
  };

  // پیدا کردن عنوان فیلتر فعال
  const activeFilter = CATEGORY_FILTERS.find(f => f.id === categoryFilter);

  return (
    <>
      <style>{`
        /* ======= Search bar ======= */
        .product-search-container {
          position: relative;
          display: flex;
          align-items: center;
          direction: rtl;
        }

        .product-search-input {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          border: none;
          outline: none;
          padding: 0 16px;
          line-height: 40px;
          background-color: transparent;
          cursor: pointer;
          transition: all 0.5s ease-in-out;
          color: #424242;
          font-family: Vazirmatn, sans-serif;
          font-size: 0.875rem;
        }

        .product-search-input::placeholder {
          color: transparent;
          padding: 6px;
        }

        .product-search-input:focus::placeholder {
          color: #9e9e9e;
          padding: 6px;
        }

        .product-search-input:focus,
        .product-search-input:not(:placeholder-shown) {
          background-color: #f5f5f5;
          border: 1px solid rgba(0, 0, 0, 0.12);
          width: 268px;
          cursor: text;
          padding: 2px 44px 0 40px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .product-search-icon {
          position: absolute;
          right: 0;
          height: 40px;
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(22, 163, 74, 0.15);
          border-radius: 50%;
          z-index: 1;
          border: 1px solid transparent;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
        }

        .product-search-container:hover .product-search-icon {
          background: linear-gradient(135deg, #16a34a, #15803d);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(22, 163, 74, 0.4);
        }

        .product-search-icon svg {
          color: #6b7280;
          transition: color 0.5s ease;
          animation: product-search-pulse 3s ease-in-out infinite;
        }

        .product-search-container:hover .product-search-icon svg {
          color: white;
          animation: none;
        }

        @keyframes product-search-pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }

        .product-search-input:focus ~ .product-search-icon,
        .product-search-input:not(:placeholder-shown) ~ .product-search-icon {
          background: transparent !important;
          box-shadow: none !important;
          transform: none !important;
        }

        .product-search-input:focus ~ .product-search-icon svg,
        .product-search-input:not(:placeholder-shown) ~ .product-search-icon svg {
          animation: none !important;
          color: #6b7280 !important;
        }

        .product-search-clear {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: none;
          border: none;
          padding: 0;
          transition: all 0.2s ease;
        }

        .product-search-clear:hover {
          background-color: rgba(0, 0, 0, 0.07);
        }

        /* ======= Filter & Add buttons ======= */
        .action-buttons-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-btn-wrapper {
          position: relative;
          display: inline-flex;
          z-index: 20;
        }
        .filter-btn {
          position: relative;
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          box-shadow: 0 4px 12px rgba(99,102,241,.3);
          transition: all .3s cubic-bezier(.4,0,.2,1);
          cursor: pointer; text-decoration: none; flex-shrink: 0;
          border: none; outline: none;
        }
        .filter-btn:hover {
          transform: translateY(-2px) scale(1.08);
          box-shadow: 0 8px 20px rgba(99,102,241,.45);
          background: linear-gradient(135deg,#4f46e5,#4338ca);
        }
        .filter-btn .btn-tooltip {
          position: absolute;
          bottom: calc(100% + 8px); left: 50%;
          transform: translateX(-50%) scale(.85);
          background: #1f2937; color: #fff;
          font-size: .75rem; white-space: nowrap;
          padding: 5px 10px; border-radius: 6px;
          pointer-events: none; opacity: 0;
          transition: all .2s ease;
          z-index: 9999;
        }
        .filter-btn .btn-tooltip::after {
          content:''; position:absolute; top:100%; left:50%;
          transform:translateX(-50%);
          border:5px solid transparent; border-top-color:#1f2937;
        }
        .filter-btn:hover .btn-tooltip { opacity:1; transform:translateX(-50%) scale(1); }

        /* Filter chip badge */
        .filter-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,.2);
        }

        /* ======= Add button ======= */
        .add-product-btn-wrapper {
          position: relative;
          display: inline-flex;
          z-index: 20;
        }
        .add-product-btn {
          position: relative;
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          box-shadow: 0 4px 12px rgba(22,163,74,.3);
          transition: all .3s cubic-bezier(.4,0,.2,1);
          cursor: pointer; text-decoration: none; flex-shrink: 0;
        }
        .add-product-btn:hover {
          transform: translateY(-2px) scale(1.08);
          box-shadow: 0 8px 20px rgba(22,163,74,.45);
          background: linear-gradient(135deg,#15803d,#166534);
        }
        .add-product-btn .btn-tooltip {
          position: absolute;
          bottom: calc(100% + 8px); left: 50%;
          transform: translateX(-50%) scale(.85);
          background: #1f2937; color: #fff;
          font-size: .75rem; white-space: nowrap;
          padding: 5px 10px; border-radius: 6px;
          pointer-events: none; opacity: 0;
          transition: all .2s ease;
          z-index: 9999;
        }
        .add-product-btn .btn-tooltip::after {
          content:''; position:absolute; top:100%; left:50%;
          transform:translateX(-50%);
          border:5px solid transparent; border-top-color:#1f2937;
        }
        .add-product-btn:hover .btn-tooltip { opacity:1; transform:translateX(-50%) scale(1); }

        /* ======= Edit icon ======= */
        .icon-edit-wrapper {
          position:relative; display:inline-flex;
          align-items:center; justify-content:center;
        }
        .item-edit:hover .icon-edit-wrapper { animation:writing .6s infinite alternate; }
        .icon-edit-wrapper::after {
          content:''; position:absolute; bottom:0; right:6px;
          width:0; height:2px; background:currentColor;
          transition:width .3s ease; border-radius:2px; pointer-events:none;
        }
        .item-edit:hover .icon-edit-wrapper::after { width:12px; }
        @keyframes writing {
          0%   { transform:translate(0,0) rotate(0deg); }
          25%  { transform:translate(-2px,-3px) rotate(-10deg); }
          50%  { transform:translate(0,0) rotate(0deg); }
          75%  { transform:translate(2px,-1px) rotate(5deg); }
          100% { transform:translate(0,0) rotate(0deg); }
        }

        /* ======= Delete icon ======= */
        .icon-delete {
          position:relative; display:inline-block; width:20px; height:20px; overflow:visible;
        }
        .icon-delete::after, .icon-delete::before {
          content:""; position:absolute; top:0; left:0; width:100%; height:100%;
          background-color:currentColor;
          -webkit-mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'/%3E%3C/svg%3E");
          mask-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'/%3E%3C/svg%3E");
        }
        .icon-delete::after  { clip-path:polygon(0 0,100% 0,100% 25%,0 25%); transform-origin:center 20%; transition:transform .2s; }
        .icon-delete::before { clip-path:polygon(0 25%,100% 25%,100% 100%,0 100%); }
        .item-delete:hover .icon-delete::after  { animation:lid-swing 1s infinite alternate ease-in-out; color:#ff5252; }
        .item-delete:hover .icon-delete::before { color:#ff5252; }
        @keyframes lid-swing {
          0%   { transform:translateY(0) rotate(0); }
          25%  { transform:translateY(-3px) rotate(-5deg); }
          50%  { transform:translateY(-3px) rotate(5deg); }
          75%  { transform:translateY(-3px) rotate(-5deg); }
          100% { transform:translateY(0) rotate(0); }
        }

        /* ======= Filter Menu ======= */
        .filter-menu-item {
          font-family: Vazirmatn, sans-serif !important;
          transition: all .18s ease !important;
        }
        .filter-menu-item:hover {
          background: rgba(99,102,241,.08) !important;
        }
        .filter-menu-item.selected {
          background: rgba(99,102,241,.12) !important;
          color: #6366f1 !important;
        }

        /* ======= Table ======= */
        .products-table-wrapper {
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(0,0,0,.08);
        }
        .products-inner-clip {
          border-radius: 0 0 16px 16px;
          overflow: hidden;
        }
        .products-table-header th {
          background: linear-gradient(135deg,#1e293b 0%,#334155 100%);
          color: #f1f5f9 !important;
          font-family: Vazirmatn, sans-serif;
          font-weight: 700; font-size:.85rem;
          padding: 14px 16px;
          border-bottom: none !important;
          white-space: nowrap; text-align: center;
        }
        .products-table-header th:first-child { border-radius: 0; }
        .products-table-header th:last-child  { border-radius: 0; }

        .product-row { transition: background .18s ease; }
        .product-row:hover { background: rgba(99,102,241,.06) !important; }
        .product-row td {
          font-family: Vazirmatn, sans-serif; font-size:.875rem;
          color: #374151; padding: 0 16px; height: 70px;
          border-bottom: 1px solid #f1f5f9;
          text-align: center; vertical-align: middle;
        }
        .product-row:last-child td { border-bottom: none; }
        .product-row:nth-child(even) { background: #f8fafc; }

        /* ======= Active filter chip ======= */
        .active-filter-chip {
          font-family: Vazirmatn, sans-serif !important;
          font-size: .75rem !important;
          height: 28px !important;
          background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
          color: white !important;
          border-radius: 8px !important;
        }

        .filter-btn-wrapper {
          position: relative;
          display: inline-flex;
          z-index: 20;
        }

        .products-header-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,.07);
          padding: 12px 20px;
          margin-bottom: 10px;
        }
        .products-header-title {
          font-family: Vazirmatn, sans-serif;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 2px 0;
        }
        .products-header-subtitle {
          font-family: Vazirmatn, sans-serif;
          font-size: 14px;
          color: #78909c;
          margin-right: 8px;
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          max-width: 0;
          animation: typewriter 0.9s steps(25, end) forwards;
        }
        .products-header-subtitle b { font-size: 16px; }
        @keyframes typewriter {
          from { max-width: 0; }
          to   { max-width: 300px; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
        <Toaster position="top-right" />

        {/* ===== دیالوگ حذف ===== */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, id: null, name: "" })}
          dir="rtl"
          PaperProps={{ sx: { borderRadius: "12px" } }}
        >
          <DialogTitle sx={{
            fontFamily: "Vazirmatn, sans-serif",
            display: "flex", alignItems: "center", gap: 1,
            backgroundColor: "#ef4444", color: "#ffffff",
            borderBottom: "3px solid", borderColor: "#b91c1c",
            px: 3, py: 1.5,
          }}>
            <Icon path={mdiTrashCanOutline} size={1} color="#ffffff" />
            حذف محصول
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", mt: "6px" }}>
              آیا مطمئن هستید که می‌خواهید محصول
              <strong style={{ color: '#E53935', margin: '0 4px' }}>
                «{deleteDialog.name}»
              </strong>
              را حذف کنید؟
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, id: null, name: "" })}
              sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
              <Icon path={mdiCloseCircleOutline} size={1} /> انصراف
            </Button>
            <Button onClick={confirmDelete} color="error" variant="contained"
              sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
              <Icon path={mdiDeleteCircleOutline} size={1} /> بله، حذف شود
            </Button>
          </DialogActions>
        </Dialog>

        {/* ===== هدر ===== */}
        <div className="products-header-card">
          <p className="products-header-title">
            <Icon path={mdiStoreCogOutline} size={1.2} />
            مدیریت محصولات
          </p>
          {isFirstLoad ? (
            <div style={{
              height: 16, width: 120, borderRadius: 4,
              background: "linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              marginRight: 8,
            }} />
          ) : (
            <span className="products-header-subtitle" key={total}>
              <b style={{ color: "#1e2a2f" }}>{total.toLocaleString("fa-IR")}</b> محصول یافت شد
            </span>
          )}
        </div>

        {/* ===== کارت اصلی ===== */}
        <Paper elevation={0} className="products-table-wrapper" sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

          {/* نوار بالا: سرچ، دکمه فیلتر و دکمه افزودن */}
          <Box sx={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            px: 2, py: 1.5,
            background: "#fff",
            borderRadius: "16px 16px 0 0",
            borderBottom: "1px solid #e2e8f0",
            position: "relative", zIndex: 10,
          }}>
            {/* سرچ بار */}
            <div className="flex items-center gap-3">
              {isFirstLoad ? (
                <Box sx={{
                  width: 40, height: 40, flexShrink: 0,
                  animation: 'search-skeleton-zoom 1.4s ease-in-out infinite',
                  '@keyframes search-skeleton-zoom': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.18)', opacity: 0.65 },
                  },
                }}>
                  <Skeleton variant="circular" width={40} height={40}
                    sx={{ bgcolor: 'rgba(22,163,74,.15)' }} />
                </Box>
              ) : (
                <>
                  <div className="product-search-container">
                    <input
                      type="text"
                      className="product-search-input"
                      placeholder="جستجو بر اساس نام محصول..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      title="جستجو"
                    />
                    <div className="product-search-icon">
                      <Icon path={mdiMagnify} size={0.9} />
                    </div>
                    {search && (
                      <button
                        className="product-search-clear"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setSearch("")}
                        title="پاک کردن"
                      >
                        <Icon path={mdiClose} size={0.75} color="#757575" />
                      </button>
                    )}
                  </div>

                  {/* نمایش چیپ فیلتر فعال */}
                  {categoryFilter !== "all" && activeFilter && (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.8,
                        px: 1.2,
                        py: 0.4,
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        color: "white",
                        borderRadius: "8px",
                        fontFamily: "Vazirmatn, sans-serif",
                        fontSize: ".75rem",
                        fontWeight: 500,
                        height: 28,
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(99,102,241,.25)",
                      }}
                    >
                      {activeFilter.image ? (
                        <img
                          src={activeFilter.image}
                          alt={activeFilter.name}
                          style={{
                            width: 16,
                            height: 16,
                            objectFit: "contain",
                            flexShrink: 0,
                          }}
                        />
                      ) : activeFilter.icon ? (
                        <Icon path={activeFilter.icon} size={0.6} color="white" />
                      ) : null}

                      <span>{activeFilter.name}</span>

                      {/* دکمه حذف */}
                      <Box
                        onClick={() => setCategoryFilter("all")}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          transition: "all .15s ease",
                          flexShrink: 0,
                          "&:hover": {
                            background: "rgba(255,255,255,.2)",
                          },
                        }}
                      >
                        <Icon path={mdiClose} size={0.55} color="white" />
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </div>

            {/* دکمه‌های فیلتر و افزودن */}
            <div className="flex items-center gap-2">
              {isFirstLoad ? (
                <>
                  <Skeleton variant="circular" width={40} height={40}
                    sx={{ bgcolor: 'rgba(99,102,241,.15)' }} />
                  <Skeleton variant="circular" width={40} height={40}
                    sx={{ bgcolor: 'rgba(22,163,74,.15)' }} />
                </>
              ) : (
                <>
                  {/* دکمه فیلتر دسته‌بندی */}
                  <span className="filter-btn-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
                    <button
                      className="filter-btn"
                      onClick={handleFilterClick}
                      aria-label="فیلتر دسته‌بندی"
                    >
                      <Icon path={mdiFilterVariant} size={1} />
                      {categoryFilter !== "all" && <span className="filter-badge" />}
                      <span className="btn-tooltip">فیلتر دسته‌بندی محصولات</span>
                    </button>

                    {/* منوی dropdown سفارشی - فقط یک بار */}
                    {openFilter && (
                      <>
                        {/* overlay برای بستن با کلیک بیرون */}
                        <Box
                          onClick={handleFilterClose}
                          sx={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 1299,
                          }}
                        />

                        {/* منوی dropdown */}
                        <Box
                          dir="rtl"
                          sx={{
                            position: "absolute",
                            top: "calc(100% + 10px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 1300,
                            minWidth: 220,
                            background: "#fff",
                            borderRadius: "12px",
                            boxShadow: "0 4px 24px rgba(0,0,0,.15)",
                            overflow: "visible",
                            py: 1,
                            "&::before": {
                              content: '""',
                              display: "block",
                              position: "absolute",
                              top: -5,
                              left: "50%",
                              width: 10,
                              height: 10,
                              background: "#fff",
                              transform: "translateX(-50%) rotate(45deg)",
                              boxShadow: "-2px -2px 4px rgba(0,0,0,.06)",
                              zIndex: -1,
                            },
                          }}
                        >
                          {CATEGORY_FILTERS.map((filter) => (
                            <Box
                              key={filter.id}
                              onClick={() => handleFilterSelect(filter.id)}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                px: 2,
                                py: 1.2,
                                cursor: "pointer",
                                fontFamily: "Vazirmatn, sans-serif",
                                fontSize: ".875rem",
                                color: categoryFilter === filter.id ? "#6366f1" : "#374151",
                                fontWeight: categoryFilter === filter.id ? 600 : 400,
                                background: categoryFilter === filter.id
                                  ? "rgba(99,102,241,.12)"
                                  : "transparent",
                                transition: "all .18s ease",
                                position: "relative",
                                zIndex: 1,
                                "&:hover": {
                                  background: categoryFilter === filter.id
                                    ? "rgba(99,102,241,.15)"
                                    : "rgba(99,102,241,.08)",
                                },
                              }}
                            >
                              {/* تصویر یا آیکون */}
                              {filter.image ? (
                                <img
                                  src={filter.image}
                                  alt={filter.name}
                                  style={{
                                    width: 22,
                                    height: 22,
                                    objectFit: "contain",
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <Icon
                                  path={filter.icon || mdiPackageVariant}
                                  size={0.9}
                                  color={categoryFilter === filter.id ? "#6366f1" : "#64748b"}
                                />
                              )}
                              <span style={{ flex: 1 }}>{filter.name}</span>
                              {categoryFilter === filter.id && (
                                <Icon path={mdiCheck} size={0.8} color="#6366f1" />
                              )}
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </span>

                  {/* دکمه افزودن محصول */}
                  <span className="add-product-btn-wrapper">
                    <Link href="/admin/products/add" className="add-product-btn" aria-label="افزودن محصول">
                      <Icon path={mdiStorePlusOutline} size={1} />
                      <span className="btn-tooltip">افزودن محصول</span>
                    </Link>
                  </span>
                </>
              )}
            </div>
          </Box>

          {/* اسکلتون — فقط بار اول */}
          {isFirstLoad ? (
            <Box sx={{ pb: 2 }}>
              <Table component="table" sx={{ width: "100%", tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow className="products-table-header">
                    {columns.map((col) => (
                      <TableCell key={col.id} sx={{ width: col.width, minWidth: col.width }}>
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
              </Table>

              <Table sx={{ width: "100%", tableLayout: "fixed" }}>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} sx={{
                      background: i % 2 === 1 ? "#f8fafc" : "#fff",
                      "& td": { borderBottom: "1px solid #f1f5f9", height: 70, px: 2, verticalAlign: "middle" },
                    }}>
                      <TableCell sx={{ width: 80, textAlign: "center" }}>
                        <Skeleton variant="text" width={36} height={28} sx={{ mx: "auto" }} />
                      </TableCell>
                      <TableCell sx={{ width: 180 }}>
                        <Skeleton variant="text" width="85%" height={26} sx={{ mx: "auto" }} />
                      </TableCell>
                      <TableCell sx={{ width: 110, textAlign: "center" }}>
                        <Skeleton variant="text" width={60} height={26} sx={{ mx: "auto" }} />
                      </TableCell>
                      <TableCell sx={{ width: 110, textAlign: "center" }}>
                        <Skeleton variant="text" width={60} height={26} sx={{ mx: "auto" }} />
                      </TableCell>
                      <TableCell sx={{ width: 90, textAlign: "center" }}>
                        <Skeleton variant="text" width={40} height={26} sx={{ mx: "auto" }} />
                      </TableCell>
                      <TableCell sx={{ width: 140, textAlign: "center" }}>
                        <Skeleton variant="text" width={90} height={26} sx={{ mx: "auto" }} />
                      </TableCell>
                      <TableCell sx={{ width: 90, textAlign: "center" }}>
                        <Skeleton variant="text" width={50} height={26} sx={{ mx: "auto" }} />
                      </TableCell>
                      <TableCell sx={{ width: 90, textAlign: "center" }}>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: "8px" }} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ width: 140, textAlign: "center" }}>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: "8px" }} />
                          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: "8px" }} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                px: 2, py: 1.5,
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                borderRadius: "0 0 16px 16px",
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Skeleton variant="text" width={90} height={22} />
                  <Skeleton variant="rounded" width={52} height={30} sx={{ borderRadius: "6px" }} />
                </Box>
                <Skeleton variant="text" width={90} height={22} sx={{ mx: "auto" }} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Skeleton variant="circular" width={28} height={28} />
                  <Skeleton variant="rounded" width={30} height={30} sx={{ borderRadius: "8px" }} />
                  <Skeleton variant="circular" width={28} height={28} />
                </Box>
              </Box>
            </Box>
          ) : (
            <Box className="products-inner-clip" sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <TableContainer component={Box} dir="rtl" sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                <Table>
                  <TableHead>
                    <TableRow className="products-table-header">
                      {columns.map((col) => (
                        <TableCell key={col.id} sx={{ width: col.width, minWidth: col.width }}>
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {pagedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} sx={{
                          textAlign: "center", py: 6,
                          fontFamily: "Vazirmatn, sans-serif",
                          color: "#94a3b8", fontSize: ".95rem",
                        }}>
                          محصولی یافت نشد
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedProducts.map((row) => (
                        <TableRow key={row.id} className="product-row">

                          <TableCell>{row.id?.toLocaleString("fa-IR")}</TableCell>

                          <TableCell sx={{ fontWeight: 600, color: "#1e293b !important" }}>
                            {row.name || "—"}
                          </TableCell>

                          <TableCell>{formatPrice(row.price)}</TableCell>

                          <TableCell>{formatPrice(getFinalPrice(row))}</TableCell>

                          <TableCell>
                            {row.stock != null ? row.stock.toLocaleString("fa-IR") : "—"}
                          </TableCell>

                          <TableCell>{getCategoryName(row)}</TableCell>

                          <TableCell>
                            {row.discount != null ? `${row.discount.toLocaleString("fa-IR")}%` : "—"}
                          </TableCell>

                          <TableCell>
                            {row.image ? (
                              <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <img
                                  src={getImagePath(row.image)}
                                  alt={row.name || "product"}
                                  onError={(e) => { e.target.src = "/image/default-product.jpg"; }}
                                  style={{
                                    width: 44, height: 44, objectFit: "cover",
                                    borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                                  }}
                                />
                              </Box>
                            ) : "—"}
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                              <Tooltip title="ویرایش محصول" placement="top" arrow>
                                <Link
                                  href={`/admin/products/edit/${row.id}`}
                                  style={{ display: "inline-flex", borderRadius: "50%", textDecoration: "none" }}
                                >
                                  <IconButton size="small" sx={{ color: '#F57C00' }} className="item-edit">
                                    <span className="icon-edit-wrapper">
                                      <Icon path={mdiPen} size={0.8} />
                                    </span>
                                  </IconButton>
                                </Link>
                              </Tooltip>

                              <Tooltip title="حذف محصول" placement="top" arrow>
                                <IconButton size="small" sx={{ color: '#E53935' }}
                                  className="item-delete"
                                  onClick={() => handleDelete(row.id, row.name)}>
                                  <span className="icon-delete" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <CustomPagination
                page={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </>
  );
}