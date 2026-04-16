"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
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
  IconButton
} from "@mui/material";
import Link from "next/link";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Icon from '@mdi/react';
import { mdiStoreCogOutline, mdiMagnify, mdiClose, mdiStorePlusOutline, mdiDeleteCircleOutline, mdiCloseCircleOutline, mdiTrashCanOutline, mdiPen } from '@mdi/js';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/admin/products", {
        headers: { "Cache-Control": "no-cache" },
      });
      const validProducts = Array.isArray(data)
        ? data.filter(
          (product, index) => {
            if (
              !product ||
              typeof product !== "object" ||
              !product.id ||
              typeof product.name !== "string" ||
              typeof product.price !== "number"
            ) {
              console.warn(`Invalid product at index ${index}:`, product);
              return false;
            }
            return true;
          }
        )
        : [];
      setProducts(validProducts);
    } catch (err) {
      console.error("Error fetching products:", err.response?.data || err.message);
      toast.error("خطا در دریافت محصولات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteProduct = (id, name) => {
    setDeleteDialog({ open: true, id, name });
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
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("مشکلی در حذف محصول به‌وجود آمد.");
    }
  };

  const columns = [
    {
      field: "id",
      headerName: "شناسه",
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      width: 70,
      renderCell: (params) => params.value.toLocaleString("fa-IR")
    },
    {
      field: "name",
      headerName: "نام محصول",
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      minWidth: 150,
      flex: 1,
      renderCell: (params) => (
        <span>{params.value}</span>
      ),
    },
    {
      field: "price",
      headerName: "قیمت",
      width: 100,
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      renderCell: (params) => params.value.toLocaleString("fa-IR").replace(/٬/g, ","),
    },
    {
      field: "finalPrice",
      headerName: "قیمت نهایی",
      width: 100,
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      renderCell: (params) => {
        const finalPrice =
          params.row.finalPrice != null && !isNaN(params.row.finalPrice)
            ? params.row.finalPrice
            : params.row.discount != null && !isNaN(params.row.discount)
              ? params.row.price * (1 - params.row.discount / 100)
              : params.row.price;
        return <span>{finalPrice.toLocaleString("fa-IR").replace(/٬/g, ",")}</span>;
      },
    },
    {
      field: "stock",
      headerName: "موجودی",
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      width: 80,
      renderCell: (params) => (
        <span>
          {params.value != null
            ? params.value.toLocaleString("fa-IR").replace(/٬/g, ",")
            : "—"}
        </span>
      ),
    },
    {
      field: "category",
      headerName: "دسته‌بندی",
      width: 150,
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      renderCell: (params) => {
        const categoryName =
          params.row.Category?.name ||
          params.row.categoryName ||
          "بدون دسته‌بندی";
        return <span>{categoryName}</span>;
      },
    },
    {
      field: "discount",
      headerName: "تخفیف",
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      width: 100,
      renderCell: (params) => {
        const discount =
          params.row.discount != null ? `${params.row.discount.toLocaleString("fa-IR")}%` : "—";
        return <span>{discount}</span>;
      },
    },
    {
      field: "image",
      headerName: "تصویر",
      width: 100,
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      renderCell: (params) =>
        params.value ? (
          <img
            src={params.value}
            className="w-10 h-10 object-cover rounded"
            alt=""
            onError={() =>
              console.error(`Failed to load image: ${params.value}`)
            }
          />
        ) : (
          "—"
        ),
    },
    // داخل آرایه columns، آبجکت مربوط به actions رو با این کد جایگزین کن:
    {
      field: "actions",
      headerName: "عملیات",
      width: 180,
      renderCell: (params) => (
        <div className="flex items-center justify-center gap-2 w-full h-full">
          <Tooltip title="ویرایش بنر" placement="top" arrow
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      // عدد اول: جابجایی افقی | عدد دوم: فاصله عمودی از دکمه
                      // برای نزدیک‌تر شدن، عدد دوم را به سمت 0 یا اعداد منفی ببرید
                      offset: [0, -8],
                    },
                  },
                ],
              },
            }}
          >
            <Link href={`/admin/products/edit/${params.row.id}`} style={{
              display: 'inline-flex', // باعث می‌شود لینک فقط به اندازه محتوا فضا بگیرد
              borderRadius: '50%',    // محدوده هاور را دایره‌ای می‌کند
              textDecoration: 'none'
            }}>
              <IconButton size="small" sx={{ color: '#F57C00' }} className="item-edit">
                <span className="icon-edit-wrapper">
                  <Icon path={mdiPen} size={0.8} className="icon-edit" />
                </span>
              </IconButton>
            </Link>
          </Tooltip>

          <Tooltip title="حذف بنر" placement="top" arrow
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      // عدد اول: جابجایی افقی | عدد دوم: فاصله عمودی از دکمه
                      // برای نزدیک‌تر شدن، عدد دوم را به سمت 0 یا اعداد منفی ببرید
                      offset: [0, -8],
                    },
                  },
                ],
              },
            }}
          >
            <IconButton
              size="small"
              sx={{ color: '#E53935' }}
              className="item-delete"
              onClick={() => deleteProduct(params.row.id, params.row.name)}
            >
              {/* برای آیکون سطل زباله، از همون ترفند CSS Mask خودت استفاده می‌کنیم */}
              <span className="icon-delete"></span>
            </IconButton>
          </Tooltip>
        </div>
      ),
      headerAlign: 'center',
      align: 'center',
    },
  ];

  return (
    <>
      {/* ===== استایل‌های سرچ‌بار و دکمه افزودن ===== */}
      <style>{`
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
          font-family: inherit;
          font-size: 0.875rem;
        }

        .product-search-input::placeholder {
          color: transparent;
          padding-bottom: 3px
        }

        .product-search-input:focus::placeholder {
          color: #9e9e9e;
        }

        .product-search-input:focus,
        .product-search-input:not(:placeholder-shown) {
          background-color: #f5f5f5;
          border: 1px solid rgba(0, 0, 0, 0.12);
          width: 260px;
          cursor: text;
          padding: 0 44px 0 40px;
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

        /* ===== دکمه افزودن محصول با تولتیپ ===== */
        .add-product-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          text-decoration: none;
          flex-shrink: 0;
        }

        .add-product-btn:hover {
          transform: translateY(-2px) scale(1.08);
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.45);
          background: linear-gradient(135deg, #15803d, #166534);
        }

        .add-product-btn .btn-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) scale(0.85);
          background: #1f2937;
          color: white;
          font-size: 0.75rem;
          white-space: nowrap;
          padding: 5px 10px;
          border-radius: 6px;
          pointer-events: none;
          opacity: 0;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .add-product-btn .btn-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: #1f2937;
        }

        .add-product-btn:hover .btn-tooltip {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }

        /* --- انیمیشن ویرایش اصلاح شده --- */
        .icon-edit-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .item-edit:hover .icon-edit-wrapper {
          animation: writing 0.6s infinite alternate;
        }

        /* ساخت خط زیر مداد روی span */
        .icon-edit-wrapper::after {
          content: '';
          position: absolute;
          bottom: 0; /* تنظیم فاصله خط از نوک مداد */
          right: 6px;
          width: 0;
          height: 2px;
          background: currentColor;
          transition: width 0.3s ease;
          border-radius: 2px;
          pointer-events: none;
        }

        .item-edit:hover .icon-edit-wrapper::after {
          width: 12px; /* طول خط هنگام هاور */
        }

        @keyframes writing {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-2px, -3px) rotate(-10deg); }
          50% { transform: translate(0, 0) rotate(0deg); }
          75% { transform: translate(2px, -1px) rotate(5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        /* --- انیمیشن حذف --- */
        .icon-delete {
          position: relative;
          display: inline-block;
          width: 20px;
          height: 20px;
          overflow: visible;
        }

        .icon-delete::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: currentColor;
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'/%3E%3C/svg%3E");
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'/%3E%3C/svg%3E");
          clip-path: polygon(0 0, 100% 0, 100% 25%, 0 25%);
          transform-origin: center 20%;
          transition: transform 0.2s;
        }

        .icon-delete::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: currentColor;
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'/%3E%3C/svg%3E");
          mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'/%3E%3C/svg%3E");
          clip-path: polygon(0 25%, 100% 25%, 100% 100%, 0 100%);
        }

        .item-delete:hover .icon-delete::after {
          animation: lid-swing 1s infinite alternate ease-in-out;
          color: #ff5252;
        }

        .item-delete:hover .icon-delete::before {
          color: #ff5252;
        }

        @keyframes lid-swing {
          0% { transform: translateY(0) rotate(0); }
          25% { transform: translateY(-3px) rotate(-5deg); }
          50% { transform: translateY(-3px) rotate(5deg); }
          75% { transform: translateY(-3px) rotate(-5deg); }
          100% { transform: translateY(0) rotate(0); }
        }
      `}</style>

      <div className="p-4 max-w-full mx-auto">
        <Toaster position="top-right" />

        {/* ===== دیالوگ تأیید حذف محصول ===== */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, id: null, name: "" })}
          dir="rtl"
          PaperProps={{
            sx: { borderRadius: "12px" },
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "Vazirmatn, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 1,
              backgroundColor: "#ef4444",
              color: "#ffffff",
              borderBottom: "3px solid",
              borderColor: "#b91c1c",
              px: 3,
              py: 1.5,
            }}
          >
            <Icon path={mdiTrashCanOutline} size={1} color="#ffffff" />
            حذف محصول
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "6px" }}>
              آیا مطمئن هستید که می‌خواهید محصول
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
              <Icon path={mdiCloseCircleOutline} size={1} />
              انصراف
            </Button>
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
              sx={{ fontFamily: "Vazirmatn, sans-serif" }}
            >
              <Icon path={mdiDeleteCircleOutline} size={1} />
              بله، حذف شود
            </Button>
          </DialogActions>
        </Dialog>

        <div className="flex justify-between items-center mb-4">

          {/* ===== عنوان + سرچ‌بار (یا اسکلتون) ===== */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800 flex gap-1 whitespace-nowrap">
              <Icon path={mdiStoreCogOutline} size={1.2} />
              مدیریت محصولات
            </h1>

            {/* اسکلتون دایره‌ای در حالت لودینگ، سرچ‌بار واقعی بعد از لود */}
            {loading ? (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  animation: 'search-skeleton-zoom 1.4s ease-in-out infinite',
                  '@keyframes search-skeleton-zoom': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.18)', opacity: 0.65 },
                  },
                }}
              >
                <Skeleton
                  variant="circular"
                  width={40}
                  height={40}
                  sx={{ bgcolor: 'rgba(22, 163, 74, 0.15)' }}
                />
              </Box>
            ) : (
              <div className="product-search-container">
                <input
                  type="text"
                  className="product-search-input"
                  placeholder="جستجو بر اساس نام محصول..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
            )}
          </div>

          {/* ===== دکمه افزودن محصول (یا اسکلتون در لودینگ) ===== */}
          {loading ? (
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                animation: 'add-btn-skeleton-zoom 1.4s ease-in-out infinite',
                '@keyframes add-btn-skeleton-zoom': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.18)', opacity: 0.65 },
                },
              }}
            >
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                sx={{ bgcolor: 'rgba(22, 163, 74, 0.15)' }}
              />
            </Box>
          ) : (
            <Link
              href="/admin/products/add"
              className="add-product-btn"
              aria-label="افزودن محصول"
            >
              <Icon path={mdiStorePlusOutline} size={1} />
              <span className="btn-tooltip">افزودن محصول</span>
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <Box sx={{ width: "100%" }}>
              {/* هدرهای واقعی جدول */}
              <Box sx={{
                display: "flex",
                alignItems: "center",
                height: 56,
                backgroundColor: '#f3f4f6',
                borderBottom: '2px solid #e5e7eb',
                px: 2,
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#1f2937'
              }}>
                <Box sx={{ width: 70, textAlign: 'center' }}>شناسه</Box>
                <Box sx={{ minWidth: 150, flex: 1, textAlign: 'center' }}>نام محصول</Box>
                <Box sx={{ width: 100, textAlign: 'center' }}>قیمت</Box>
                <Box sx={{ width: 100, textAlign: 'center' }}>قیمت نهایی</Box>
                <Box sx={{ width: 80, textAlign: 'center' }}>موجودی</Box>
                <Box sx={{ width: 150, textAlign: 'center' }}>دسته‌بندی</Box>
                <Box sx={{ width: 100, textAlign: 'center' }}>تخفیف</Box>
                <Box sx={{ width: 100, textAlign: 'center' }}>تصویر</Box>
                <Box sx={{ width: 155, textAlign: 'center' }}>عملیات</Box>
              </Box>

              {/* ردیف‌های اسکلتون */}
              {Array.from(new Array(6)).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    height: 70,
                    p: 2,
                    borderBottom: '1px solid #e5e7eb',
                    '&:hover': { backgroundColor: '#f9fafb' }
                  }}
                >
                  <Box sx={{ width: 70, display: 'flex', justifyContent: 'center' }}>
                    <Skeleton variant="text" width={40} height={30} />
                  </Box>
                  <Box sx={{ minWidth: 150, flex: 1, textAlign: 'center' }}>
                    <Skeleton variant="text" width="90%" height={25} />
                    <Skeleton variant="text" width="60%" height={18} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box sx={{ width: 100, textAlign: 'center' }}>
                    <Skeleton variant="text" width={60} height={25} />
                  </Box>
                  <Box sx={{ width: 100, textAlign: 'center' }}>
                    <Skeleton variant="text" width={60} height={25} />
                  </Box>
                  <Box sx={{ width: 80, textAlign: 'center' }}>
                    <Skeleton variant="text" width={40} height={25} />
                  </Box>
                  <Box sx={{ width: 150, textAlign: 'center' }}>
                    <Skeleton variant="text" width={100} height={25} />
                  </Box>
                  <Box sx={{ width: 100, textAlign: 'center' }}>
                    <Skeleton variant="text" width={50} height={25} />
                  </Box>
                  <Box sx={{ width: 100, display: 'flex', justifyContent: 'center' }}>
                    <Skeleton variant="square" width={40} height={40} />
                  </Box>
                  <Box sx={{ width: 155, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Skeleton variant="rounded" width={70} height={36} />
                      <Skeleton variant="rounded" width={70} height={36} />
                    </Box>
                  </Box>
                </Box>
              ))}

              {/* فوتر اسکلتون */}
              <Box sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 52,
                borderTop: '1px solid #e5e7eb',
                backgroundColor: '#f3f4f6',
                px: 2
              }}>
                <Skeleton variant="text" width={120} height={20} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Skeleton variant="text" width={80} height={20} />
                  <Skeleton variant="rounded" width={100} height={30} />
                </Box>
              </Box>
            </Box>
          ) : (
            <DataGrid
              rows={filteredProducts}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[5, 10]}
              loading={false}
              getRowId={(row) => row.id}
              autoHeight
              disableColumnMenu
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
                "& .MuiDataGrid-root": { border: "none" },
                "& .MuiDataGrid-cell": {
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#f3f4f6",
                  borderBottom: "2px solid #e5e7eb",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 600,
                  color: "#1f2937",
                },
                "& .MuiDataGrid-row:hover": { backgroundColor: "#f9fafb" },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid #e5e7eb",
                  backgroundColor: "#f3f4f6",
                },
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}