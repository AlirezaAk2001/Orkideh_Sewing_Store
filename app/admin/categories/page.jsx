"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import AppImage from "@/app/components/AppImage";
import Icon from '@mdi/react';
import {
  mdiShapeOutline,
  mdiShapePlusOutline,
  mdiDeleteCircleOutline,
  mdiCloseCircleOutline,
  mdiTrashCanOutline,
  mdiPen,
  mdiChevronRight,
  mdiChevronLeft,
} from '@mdi/js';

const PAGE_SIZE_OPTIONS = [3, 5, 10];

// ─── Custom Pagination ────────────────────────────────────────────────────────
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
      {/* سمت راست: تعداد در صفحه */}
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
          onMouseOut={(e)  => e.target.style.borderColor = "#e2e8f0"}
          onFocus={(e)     => e.target.style.borderColor = "#6366f1"}
          onBlur={(e)      => e.target.style.borderColor = "#e2e8f0"}
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{fa(opt)}</option>
          ))}
        </select>
      </Box>

      {/* وسط: شماره صفحه */}
      <Box sx={{ color: "#475569", fontWeight: 500 }}>
        {total === 0 ? "دسته‌بندی یافت نشد" : `صفحه ${fa(page)} از ${fa(totalPages)}`}
      </Box>

      {/* سمت چپ: دکمه‌های ناوبری */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {/* صفحه بعد */}
        <IconButton size="small" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
          sx={{
            color: page >= totalPages ? "#cbd5e1" : "#475569",
            "&:hover:not(:disabled)": { background: "rgba(99,102,241,.1)", color: "#6366f1" },
          }}>
          <Icon path={mdiChevronRight} size={0.9} />
        </IconButton>

        {/* شماره‌های صفحه */}
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

        {/* صفحه قبل */}
        <IconButton size="small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          sx={{
            color: page <= 1 ? "#cbd5e1" : "#475569",
            "&:hover:not(:disabled)": { background: "rgba(99,102,241,.1)", color: "#6366f1" },
          }}>
          <Icon path={mdiChevronLeft} size={0.9} />
        </IconButton>
      </Box>
    </Box>
  );
}

// ─── صفحه اصلی ───────────────────────────────────────────────────────────────
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

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ open: false, id: null, name: "" });

    try {
      await axios.delete("/api/admin/categories", {
        data: { id },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("دسته‌بندی با موفقیت حذف گردید.");
      fetchCategories(page, pageSize);
    } catch (err) {
      console.error(err);
      toast.error("مشکلی در حذف دسته‌بندی به‌وجود آمد.");
    }
  };

  const columns = [
    { id: "id",      label: "شناسه",      width: 80  },
    { id: "name",    label: "نام",         width: 200 },
    { id: "slug",    label: "دسته بندی",   width: 200 },
    { id: "image",   label: "تصویر",       width: 150 },
    { id: "actions", label: "عملیات",      width: 180 },
  ];

  const isFirstLoad = loading && categories.length === 0;

  return (
    <>
      <style>{`
        /* ======= Add button ======= */
        .add-category-btn-wrapper {
          position: relative;
          display: inline-flex;
          z-index: 20;
        }
        .add-category-btn {
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
        .add-category-btn:hover {
          transform: translateY(-2px) scale(1.08);
          box-shadow: 0 8px 20px rgba(22,163,74,.45);
          background: linear-gradient(135deg,#15803d,#166534);
        }
        .add-category-btn .btn-tooltip {
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
        .add-category-btn .btn-tooltip::after {
          content:''; position:absolute; top:100%; left:50%;
          transform:translateX(-50%);
          border:5px solid transparent; border-top-color:#1f2937;
        }
        .add-category-btn:hover .btn-tooltip { opacity:1; transform:translateX(-50%) scale(1); }

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

        /* ======= Table ======= */
        .categories-table-wrapper {
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(0,0,0,.08);
        }
        .categories-inner-clip {
          border-radius: 0 0 16px 16px;
          overflow: hidden;
        }
        .categories-table-header th {
          background: linear-gradient(135deg,#1e293b 0%,#334155 100%);
          color: #f1f5f9 !important;
          font-family: Vazirmatn, sans-serif;
          font-weight: 700; font-size:.85rem;
          padding: 14px 16px;
          border-bottom: none !important;
          white-space: nowrap; text-align: center;
        }
        .category-row { transition: background .18s ease; }
        .category-row:hover { background: rgba(99,102,241,.06) !important; }
        .category-row td {
          font-family: Vazirmatn, sans-serif; font-size:.875rem;
          color: #374151; padding: 0 16px; height: 80px;
          border-bottom: 1px solid #f1f5f9;
          text-align: center; vertical-align: middle;
        }
        .category-row:last-child td { border-bottom: none; }
        .category-row:nth-child(even) { background: #f8fafc; }

        .categories-header-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.07);
  padding: 12px 20px;
  margin-bottom: 10px;
}
.categories-header-title {
  font-family: Vazirmatn, sans-serif;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 2px 0;
}
.categories-header-subtitle {
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
.categories-header-subtitle b { font-size: 16px; }
@keyframes typewriter {
  from { max-width: 0; }
  to   { max-width: 300px; }
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
      `}</style>

      <Box sx={{ p: 2 }}>
        <Toaster position="top-right" />

        {/* ===== دیالوگ تأیید حذف دسته‌بندی ===== */}
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
            حذف دسته‌بندی
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "6px" }}>
              آیا مطمئن هستید که می‌خواهید دسته بندی
              <strong style={{ color: '#E53935', margin: '0 4px' }}>
                «{deleteDialog.name}»
              </strong>
              را حذف کنید؟
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, id: null, name: "" })}
              sx={{ fontFamily: "Vazirmatn, sans-serif" }}
            >
              <Icon path={mdiCloseCircleOutline} size={1} /> انصراف
            </Button>
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
              sx={{ fontFamily: "Vazirmatn, sans-serif" }}
            >
              <Icon path={mdiDeleteCircleOutline} size={1} /> بله، حذف شود
            </Button>
          </DialogActions>
        </Dialog>

        {/* ===== هدر صفحه ===== */}
        <div className="categories-header-card">
  <p className="categories-header-title">
    <Icon path={mdiShapeOutline} size={1.2} />
    مدیریت دسته‌بندی‌ها
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
    <span className="categories-header-subtitle" key={total}>
      <b style={{ color: "#1e2a2f" }}>{total.toLocaleString("fa-IR")}</b> دسته‌بندی یافت شد
    </span>
  )}
</div>

        {/* ===== کارت جدول ===== */}
        <Paper elevation={0} className="categories-table-wrapper">

          {/* نوار بالا: دکمه افزودن */}
          <Box sx={{
            display: "flex", justifyContent: "flex-end", alignItems: "center",
            px: 2, py: 1.5,
            background: "#fff",
            borderRadius: "16px 16px 0 0",
            borderBottom: "1px solid #e2e8f0",
            position: "relative", zIndex: 10,
          }}>
            {isFirstLoad ? (
              <Skeleton variant="circular" width={40} height={40}
                sx={{ bgcolor: 'rgba(22,163,74,.15)' }} />
            ) : (
              <span className="add-category-btn-wrapper">
                <Link href="/admin/categories/add" className="add-category-btn" aria-label="افزودن دسته‌بندی">
                  <Icon path={mdiShapePlusOutline} size={1} />
                  <span className="btn-tooltip">افزودن دسته‌بندی</span>
                </Link>
              </span>
            )}
          </Box>

          {/* ===== اسکلتون — فقط بار اول ===== */}
          {isFirstLoad ? (
            <Box sx={{ pb: 2 }}>
              {/* هدر واقعی جدول */}
              <Table sx={{ width: "100%", tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow className="categories-table-header">
                    {columns.map((col) => (
                      <TableCell key={col.id} sx={{ width: col.width, minWidth: col.width }}>
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
              </Table>

              {/* ردیف‌های skeleton */}
              <Table sx={{ width: "100%", tableLayout: "fixed" }}>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} sx={{
                      background: i % 2 === 1 ? "#f8fafc" : "#fff",
                      "& td": { borderBottom: "1px solid #f1f5f9", height: 80, px: 2, verticalAlign: "middle" },
                    }}>
                      {/* شناسه */}
                      <TableCell sx={{ width: 80, textAlign: "center" }}>
                        <Skeleton variant="text" width={36} height={28} sx={{ mx: "auto" }} />
                      </TableCell>
                      {/* نام */}
                      <TableCell sx={{ width: 200 }}>
                        <Skeleton variant="text" width="75%" height={26} sx={{ mx: "auto" }} />
                      </TableCell>
                      {/* slug */}
                      <TableCell sx={{ width: 200 }}>
                        <Skeleton variant="text" width="70%" height={26} sx={{ mx: "auto" }} />
                      </TableCell>
                      {/* تصویر */}
                      <TableCell sx={{ width: 150, textAlign: "center" }}>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: "8px" }} />
                        </Box>
                      </TableCell>
                      {/* عملیات */}
                      <TableCell sx={{ width: 180, textAlign: "center" }}>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: "8px" }} />
                          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: "8px" }} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* اسکلتون pagination */}
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
            /* ===== جدول اصلی ===== */
            <Box className="categories-inner-clip">
              <TableContainer component={Box} dir="rtl">
                <Table sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow className="categories-table-header">
                      {columns.map((col) => (
                        <TableCell key={col.id} sx={{ width: col.width, minWidth: col.width }}>
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} sx={{
                          textAlign: "center", py: 6,
                          fontFamily: "Vazirmatn, sans-serif",
                          color: "#94a3b8", fontSize: ".95rem",
                        }}>
                          دسته‌بندی یافت نشد
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((row) => (
                        <TableRow key={row.id} className="category-row">

                          {/* شناسه */}
                          <TableCell>{row.id?.toLocaleString("fa-IR")}</TableCell>

                          {/* نام */}
                          <TableCell sx={{ fontWeight: 600, color: "#1e293b !important" }}>
                            {row.name || "—"}
                          </TableCell>

                          {/* slug */}
                          <TableCell sx={{ color: "#64748b !important", direction: "ltr" }}>
                            {row.slug || "—"}
                          </TableCell>

                          {/* تصویر */}
                          <TableCell>
                            {row.image ? (
                              <Box sx={{ display: "flex", justifyContent: "center" }}>
                                <AppImage
                                  src={row.image}
                                  alt={row.name || "category"}
                                  width={48}
                                  height={48}
                                  onError={(e) => { e.target.style.display = "none"; }}
                                  style={{
                                    width: 48, height: 48,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                                  }}
                                />
                              </Box>
                            ) : "—"}
                          </TableCell>

                          {/* عملیات */}
                          <TableCell>
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                              <Tooltip title="ویرایش دسته‌بندی" placement="top" arrow>
                                <Link
                                  href={`/admin/categories/edit/${row.id}`}
                                  style={{ display: "inline-flex", borderRadius: "50%", textDecoration: "none" }}
                                >
                                  <IconButton size="small" sx={{ color: '#F57C00' }} className="item-edit">
                                    <span className="icon-edit-wrapper">
                                      <Icon path={mdiPen} size={0.8} className="icon-edit" />
                                    </span>
                                  </IconButton>
                                </Link>
                              </Tooltip>

                              <Tooltip title="حذف دسته‌بندی" placement="top" arrow>
                                <IconButton
                                  size="small"
                                  sx={{ color: '#E53935' }}
                                  className="item-delete"
                                  onClick={() => deleteCategory(row.id, row.name)}
                                >
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

              {/* ===== Custom Pagination ===== */}
              <CustomPagination
                page={page}
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