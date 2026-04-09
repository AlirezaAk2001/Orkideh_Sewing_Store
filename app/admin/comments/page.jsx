"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Skeleton } from "@mui/material";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, Clock, CheckCircle2, Check, XCircle } from "lucide-react";
import Icon from '@mdi/react';
import { mdiAccountBoxEditOutline } from '@mdi/js'

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const { data } = await axios.get("/api/admin/comments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("خطا در دریافت نظرات:", err);
      toast.error(err.response?.data?.error || "خطا در دریافت نظرات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const deleteComment = async (id) => {
    if (!confirm("آیا مطمئن هستید؟")) return;
    try {
      await axios.delete("/api/admin/comments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        data: { id },
      });
      toast.success("نظر حذف شد");
      fetchComments();
    } catch (err) {
      console.error("خطا در حذف نظر:", err);
      toast.error(err.response?.data?.error || "خطا در حذف نظر");
    }
  };

  const toggleApproveComment = async (id, approved) => {
    try {
      await axios.put(
        "/api/admin/comments",
        { id, approved: !approved },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success(!approved ? "نظر تأیید شد" : "نظر از حالت تأیید خارج شد");
      fetchComments();
    } catch (err) {
      console.error("خطا در به‌روزرسانی نظر:", err);
      toast.error(err.response?.data?.error || "خطا در به‌روزرسانی نظر");
    }
  };

  const columns = [
    { field: "id", 
      headerName: "شناسه", 
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      width: 50 
    },
    {
      field: "User",
      headerName: "کاربر",
      width: 150,
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      valueGetter: (params) => params.row?.User?.username || params.row?.User?.name || "نامشخص",
      renderCell: (params) => {
        const userName = params.row.User?.username || params.row.User?.name || "بدون نام";
        return <span className="flex justify-center w-full">{userName}</span>;
      },
    },
    {
      field: "Product",
      headerName: "نام محصول",
      width: 150,
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      renderCell: (params) => {
        const product = params.row.Product?.name || "بدون نام محصول";
        return (
          <div
            title={product}
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
              cursor: "default",
            }}
          >
          {product}
        </div>
      );
    },
    },
    { field: "rating", 
      headerName: "امتیاز", 
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      width: 70,
      renderCell: (params) => (
        <span>{params.value}</span>
      ),
    },
    { field: "text", 
      headerName: "نظر", 
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      width: 280,
      renderCell: (params) => (
        <span>{params.value}</span>
      ),
    },
    {
      field: "createdAt",
      headerName: "تاریخ",
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      width: 150,
      renderCell: (params) =>
        params.row?.createdAt
          ? <span className="flex justify-center w-full">{new Date(params.row.createdAt).toLocaleString("fa-IR")}</span>
          : <span className="flex justify-center w-full">نامشخص</span>,
    },
    {
      field: "approved",
      headerName: "وضعیت",
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      width: 150,
      renderCell: (params) =>
        params.row?.approved ? (
          <div className="flex items-center justify-center gap-2 text-green-600 w-full">
            <CheckCircle2 size={18} />
            <span>تأیید شده</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-yellow-600 w-full">
            <Clock size={18} />
            <span>در انتظار تأیید</span>
          </div>
        ),
    },
    {
      field: "actions",
      headerName: "عملیات",
      headerAlign: "center",
      align: "center",
      cellClassName: "center",
      width: 220,
      renderCell: (params) => (
        <div className="flex gap-2 justify-center w-full">
          <button
            onClick={() => toggleApproveComment(params.row?.id, params.row?.approved)}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl rounded text-white cursor-pointer transition ${
              params.row?.approved
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {params.row?.approved ? (
              <>
                <XCircle size={16} />
                <span>رد تأیید</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>تأیید</span>
              </>
            )}
          </button>
          <button
            onClick={() => deleteComment(params.row.id)}
            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition cursor-pointer rounded-xl"
          >
            <Trash2 size={16} />
            <span>حذف</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-xl font-bold mb-4 flex gap-1">
        <Icon path={mdiAccountBoxEditOutline} size={1.2} />
        مدیریت نظرات کاربران
      </h1>
      
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
              {/* هدر شناسه */}
              <Box sx={{ width: 50, textAlign: 'center' }}>
                شناسه
              </Box>
              
              {/* هدر کاربر */}
              <Box sx={{ width: 150, textAlign: 'center' }}>
                کاربر
              </Box>
              
              {/* هدر محصول */}
              <Box sx={{ width: 150, textAlign: 'center' }}>
                محصول
              </Box>
              
              {/* هدر امتیاز */}
              <Box sx={{ width: 70, textAlign: 'center' }}>
                امتیاز
              </Box>
              
              {/* هدر نظر */}
              <Box sx={{ width: 280, textAlign: 'center' }}>
                نظر
              </Box>
              
              {/* هدر تاریخ */}
              <Box sx={{ width: 150, textAlign: 'center' }}>
                تاریخ
              </Box>
              
              {/* هدر وضعیت */}
              <Box sx={{ width: 150, textAlign: 'center' }}>
                وضعیت
              </Box>
              
              {/* هدر عملیات */}
              <Box sx={{ width: 220, textAlign: 'center' }}>
                عملیات
              </Box>
            </Box>
            
            {/* ردیف‌های اسکلتون */}
            {Array.from(new Array(6)).map((_, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  height: 70,
                  mb: 0,
                  p: 2,
                  borderBottom: 1, 
                  borderColor: "divider",
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                {/* ستون شناسه */}
                <Box sx={{ width: 50, display: 'flex', justifyContent: 'center' }}>
                  <Skeleton variant="text" width={30} height={25} />
                </Box>
                
                {/* ستون کاربر */}
                <Box sx={{ width: 150, textAlign: 'center' }}>
                  <Skeleton variant="text" width={100} height={25} />
                  <Skeleton variant="text" width={80} height={18} sx={{ mt: 0.5 }} />
                </Box>
                
                {/* ستون محصول */}
                <Box sx={{ width: 150, textAlign: 'center' }}>
                  <Skeleton variant="text" width={120} height={25} />
                </Box>
                
                {/* ستون امتیاز */}
                <Box sx={{ width: 70, textAlign: 'center' }}>
                  <Skeleton variant="text" width={30} height={25} />
                </Box>
                
                {/* ستون نظر */}
                <Box sx={{ width: 280, textAlign: 'center' }}>
                  <Skeleton variant="text" width="90%" height={25} />
                  <Skeleton variant="text" width="70%" height={18} sx={{ mt: 0.5 }} />
                </Box>
                
                {/* ستون تاریخ */}
                <Box sx={{ width: 150, textAlign: 'center' }}>
                  <Skeleton variant="text" width={100} height={25} />
                  <Skeleton variant="text" width={80} height={18} sx={{ mt: 0.5 }} />
                </Box>
                
                {/* ستون وضعیت */}
                <Box sx={{ width: 150, display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Skeleton variant="circular" width={20} height={20} />
                    <Skeleton variant="text" width={80} height={25} />
                  </Box>
                </Box>
                
                {/* ستون عملیات */}
                <Box sx={{ width: 220, display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width={85} height={36} />
                    <Skeleton variant="rounded" width={70} height={36} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <DataGrid
            rows={comments}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10]}
            loading={false}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell.center': {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              },
            }}
          />
        )}
      </div>
      <Toaster position="top-right" />
    </div>
  );
}