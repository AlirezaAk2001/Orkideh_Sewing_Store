"use client";

import { useEffect, useRef, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Stack,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { getImagePath } from "@/app/utils/getImagePath";
import Icon from '@mdi/react';
import { mdiImageSearchOutline, mdiImagePlusOutline, mdiDeleteCircleOutline, mdiCloseCircleOutline, mdiTrashCanOutline } from '@mdi/js';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/admin/banners");
        const data = await res.json();

        if (isMounted.current) {
          setBanners(data || []);
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchBanners();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleDelete = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ open: false, id: null });

    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("خطا در حذف بنر");

      if (isMounted.current) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }

      toast.success("بنر با موفقیت حذف گردید.");
    } catch (err) {
      toast.error("مشکلی در حذف بنر به‌وجود آمد.");
    }
  };

  const columns = [
    { 
      field: "id", 
      headerName: "شناسه", 
      width: 80,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: "img",
      headerName: "تصویر",
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <img
            src={getImagePath(params.value)}
            alt={params.row.title || "banner"}
            className="w-20 h-20 object-cover rounded-md shadow-sm mr-4"
            onError={(e) => {
              e.target.src = "/image/default-banner.jpg";
            }}
          />
        ) : (
          "—"
        ),
      headerAlign: 'center',
      align: 'center',
    },
    { 
      field: "title", 
      headerName: "عنوان", 
      width: 200,
      headerAlign: 'center',
      align: 'center',
      cellClassName: 'center',
    },
    { 
      field: "desc", 
      headerName: "توضیحات", 
      width: 300,
      headerAlign: 'center',
      align: 'center',
      cellClassName: 'center',
    },
    {
      field: "actions",
      headerName: "عملیات",
      width: 180,
      renderCell: (params) => (
        <div className="flex gap-2 mr-2">
          <Link
            href={`/admin/banners/edit/${params.row.id}`}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer rounded-xl"
          >
            <Edit size={16} />
            ویرایش
          </Link>
          <button
            onClick={() => handleDelete(params.row.id)}
            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition cursor-pointer rounded-xl"
          >
            <Trash2 size={16} className="mb-1" />
            حذف
          </button>
        </div>
      ),
      headerAlign: 'center',
      align: 'center',
    },
  ];

  return (
    <>
      {/* ===== استایل دکمه افزودن بنر ===== */}
      <style>{`
        .add-banner-btn {
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

        .add-banner-btn:hover {
          transform: translateY(-2px) scale(1.08);
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.45);
          background: linear-gradient(135deg, #15803d, #166534);
        }

        .add-banner-btn .btn-tooltip {
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

        .add-banner-btn .btn-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: #1f2937;
        }

        .add-banner-btn:hover .btn-tooltip {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }
      `}</style>

      <Box sx={{ p: 2 }}>
        <Toaster position="top-right" />

        {/* ===== دیالوگ تأیید حذف بنر ===== */}
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
            حذف بنر
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontFamily: "Vazirmatn, sans-serif", marginTop: "6px" }}>
              آیا مطمئن هستید که می‌خواهید این بنر را حذف کنید؟
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

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <h1 className="text-xl font-bold flex gap-1">
            <Icon path={mdiImageSearchOutline} size={1.2} />
            مدیریت بنرها
          </h1>

          {/* ===== دکمه افزودن بنر (یا اسکلتون در لودینگ) ===== */}
          {loading ? (
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                animation: 'add-banner-skeleton-zoom 1.4s ease-in-out infinite',
                '@keyframes add-banner-skeleton-zoom': {
                  '0%, 100%': { transform: 'scale(1)',    opacity: 1    },
                  '50%':       { transform: 'scale(1.18)', opacity: 0.65 },
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
              href="/admin/banners/add"
              className="add-banner-btn"
              aria-label="افزودن بنر"
            >
              <Icon path={mdiImagePlusOutline} size={1} />
              <span className="btn-tooltip">افزودن بنر</span>
            </Link>
          )}
        </Stack>

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
                <Box sx={{ width: 80, textAlign: 'center' }}>شناسه</Box>
                <Box sx={{ width: 150, textAlign: 'center' }}>تصویر</Box>
                <Box sx={{ width: 200, textAlign: 'right', pr: 2 }}>عنوان</Box>
                <Box sx={{ width: 300, textAlign: 'right', pr: 2 }}>توضیحات</Box>
                <Box sx={{ width: 180, textAlign: 'center' }}>عملیات</Box>
              </Box>

              {/* ردیف‌های اسکلتون */}
              {Array.from(new Array(3)).map((_, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    height: 100,
                    p: 2,
                    borderBottom: 1, 
                    borderColor: "divider",
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <Box sx={{ width: 80, display: 'flex', justifyContent: 'center' }}>
                    <Skeleton variant="text" width={40} height={30} />
                  </Box>
                  <Box sx={{ width: 150, display: 'flex', justifyContent: 'center' }}>
                    <Skeleton variant="rounded" width={80} height={80} />
                  </Box>
                  <Box sx={{ width: 200, textAlign: 'right', direction: 'rtl' }}>
                    <Skeleton variant="text" width="80%" height={30} />
                    <Skeleton variant="text" width="60%" height={20} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box sx={{ width: 300, textAlign: 'right', direction: 'rtl', pr: 2 }}>
                    <Skeleton variant="text" width="90%" height={30} />
                    <Skeleton variant="text" width="70%" height={20} sx={{ mt: 0.5 }} />
                  </Box>
                  <Box sx={{ width: 180, display: 'flex', justifyContent: 'center' }}>
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
              rows={banners || []}
              columns={columns}
              pageSize={10}
              loading={false}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
                '& .MuiDataGrid-cell:focus-within': {
                  outline: 'none',
                },
                '& .MuiDataGrid-cell--textRight': {
                  textAlign: 'right',
                  direction: 'rtl',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                },
              }}
            />
          )}
        </div>
      </Box>
    </>
  );
}