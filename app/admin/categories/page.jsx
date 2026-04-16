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
import { mdiShapeOutline, mdiShapePlusOutline, mdiDeleteCircleOutline, mdiCloseCircleOutline, mdiTrashCanOutline, mdiPen } from '@mdi/js';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/admin/categories");

      const categoriesWithFixedImages = data.map((cat) => ({
        ...cat,
        image: cat.image
          ? cat.image.startsWith("/image/")
            ? cat.image
            : `/image/${cat.image}`
          : null,
      }));

      setCategories(categoriesWithFixedImages);
    } catch (err) {
      console.error(err);
      toast.error("خطا در دریافت دسته‌بندی‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const deleteCategory = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ open: false, id: null, name: "" });

    try {
      await axios.delete("/api/admin/categories", { data: { id } });
      fetchCategories();
      toast.success("دسته‌بندی با موفقیت حذف گردید.");
    } catch (err) {
      console.error(err);
      toast.error("مشکلی در حذف دسته‌بندی به‌وجود آمد.");
    }
  };

  const columns = [
    {
      field: "id",
      headerName: "شناسه",
      width: 70,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => params.value.toLocaleString("fa-IR")
    },
    {
      field: "name",
      headerName: "نام",
      width: 200,
      headerAlign: 'center',
      cellClassName: 'center',
      align: 'center'
    },
    {
      field: "slug",
      headerName: "دسته بندی",
      width: 200,
      headerAlign: 'center',
      cellClassName: 'center',
      align: 'center'
    },
    {
      field: "image",
      headerName: "تصویر",
      align: 'center',
      headerAlign: 'center',
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <img
            src={params.value}
            className="w-12 h-12 object-cover rounded mr-10"
            alt=""
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
            <Link  href={`/admin/categories/edit/${params.row.id}`} style={{
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
              onClick={() => deleteCategory(params.row.id, params.row.name)}
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
      {/* ===== استایل دکمه افزودن دسته‌بندی ===== */}
      <style>{`
        .add-category-btn {
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

        .add-category-btn:hover {
          transform: translateY(-2px) scale(1.08);
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.45);
          background: linear-gradient(135deg, #15803d, #166534);
        }

        .add-category-btn .btn-tooltip {
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

        .add-category-btn .btn-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: #1f2937;
        }

        .add-category-btn:hover .btn-tooltip {
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

      <div className="p-4">
        <Toaster position="top-right" />

        {/* ===== دیالوگ تأیید حذف دسته‌بندی ===== */}
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
          <h1 className="text-xl font-bold flex gap-1">
            <Icon path={mdiShapeOutline} size={1.2} />
            مدیریت دسته‌بندی‌ها
          </h1>

          {/* ===== دکمه افزودن دسته‌بندی (یا اسکلتون در لودینگ) ===== */}
          {loading ? (
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                animation: 'add-category-skeleton-zoom 1.4s ease-in-out infinite',
                '@keyframes add-category-skeleton-zoom': {
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
              href="/admin/categories/add"
              className="add-category-btn"
              aria-label="افزودن دسته‌بندی"
            >
              <Icon path={mdiShapePlusOutline} size={1} />
              <span className="btn-tooltip">افزودن دسته‌بندی</span>
            </Link>
          )}
        </div>

        <div style={{ height: 500, width: "100%" }}>
          {loading ? (
            <Box sx={{ width: "100%", height: "100%" }}>
              {/* هدرهای واقعی جدول */}
              <Box sx={{
                display: "flex",
                alignItems: "center",
                height: 56,
                backgroundColor: 'rgb(250, 250, 250)',
                borderBottom: '1px solid rgba(224, 224, 224, 1)',
                px: 2,
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}>
                <Box sx={{ width: 70, textAlign: 'center' }}>شناسه</Box>
                <Box sx={{ width: 200, textAlign: 'center' }}>نام</Box>
                <Box sx={{ width: 200, textAlign: 'center' }}>دسته بندی</Box>
                <Box sx={{ width: 150, textAlign: 'center' }}>تصویر</Box>
                <Box sx={{ width: 150, textAlign: 'center' }}>عملیات</Box>
              </Box>

              {/* ردیف‌های اسکلتون */}
              {Array.from(new Array(2)).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    height: 80,
                    p: 2,
                    borderBottom: 1,
                    borderColor: "divider",
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <Box sx={{ width: 70, display: 'flex', justifyContent: 'center' }}>
                    <Skeleton variant="text" width={40} height={30} />
                  </Box>
                  <Box sx={{ width: 200, textAlign: 'center' }}>
                    <Skeleton variant="text" width="90%" height={30} />
                    <Skeleton variant="text" width="60%" height={20} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box sx={{ width: 200, textAlign: 'center' }}>
                    <Skeleton variant="text" width="80%" height={30} />
                    <Skeleton variant="text" width="50%" height={20} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box sx={{ width: 150, display: 'flex', justifyContent: 'center' }}>
                    <Skeleton variant="square" width={48} height={48} />
                  </Box>
                  <Box sx={{ width: 150, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Skeleton variant="rounded" width={70} height={36} />
                      <Skeleton variant="rounded" width={70} height={36} />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <DataGrid
              rows={categories || []}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[5, 10]}
              loading={false}
              disableRowSelectionOnClick
              getRowId={(row) => row.id}
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}