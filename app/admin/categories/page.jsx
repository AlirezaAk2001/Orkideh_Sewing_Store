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
} from "@mui/material";
import Link from "next/link";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Edit, Trash2 } from "lucide-react";
import Icon from '@mdi/react';
import { mdiShapeOutline, mdiShapePlusOutline, mdiDeleteCircleOutline, mdiCloseCircleOutline, mdiTrashCanOutline } from '@mdi/js';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

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
    setDeleteDialog({ open: false, id: null });

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
    {
      field: "actions",
      headerName: "عملیات",
      headerAlign: 'center',
      align: 'center',
      width: 150,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Link
            href={`/admin/categories/edit/${params.row.id}`}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer rounded-xl"
          >
            <Edit size={16} />
            ویرایش
          </Link>
          <button
            onClick={() => deleteCategory(params.row.id)}
            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition cursor-pointer rounded-xl"
          >
            <Trash2 size={16} />
            حذف
          </button>
        </div>
      ),
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
      `}</style>

      <div className="p-4">
        <Toaster position="top-right" />

        {/* ===== دیالوگ تأیید حذف دسته‌بندی ===== */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, id: null })}
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
              آیا مطمئن هستید که می‌خواهید این دسته‌بندی را حذف کنید؟
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, id: null })}
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