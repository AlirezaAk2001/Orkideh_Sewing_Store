"use client";

import { useEffect, useState } from "react";
import { Box, Button, TextField, CircularProgress } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Save } from "lucide-react";
import Image from "next/image";
import Icon from '@mdi/react';
import { mdiImageEditOutline } from '@mdi/js';

export default function EditBannerPage() {
  const router = useRouter();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

    // این آبجکت را بالای کامپوننت یا قبل از return تعریف کنید
  const rtlStyles = {
    InputLabelProps: {
      sx: {
        transformOrigin: "right !important",
        left: "inherit !important",
        right: "1.75rem !important",
      },
    },
    sx: {
      "& legend": {
      textAlign: "right",
      },
    },
  };

  // 📦 دریافت اطلاعات بنر
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch(`/api/admin/banners/${id}`);
        if (!res.ok) throw new Error("بنر پیدا نشد");
        const data = await res.json();

        setTitle(data.title || "");
        setDesc(data.desc || "");
        setImg(data.img || "");
      } catch (err) {
        toast.error("خطا در دریافت اطلاعات بنر");
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, [id]);

  // 💾 ذخیره تغییرات
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, desc, img }),
      });

      if (!res.ok) throw new Error("خطا در ویرایش بنر");

      toast.success("بنر با موفقیت ویرایش شد");
      router.push("/admin/banners");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ⏳ نمایش وضعیت در حال بارگذاری
  if (loading) {
    return ( // <-- این return را اضافه کنید
      <div className="flex flex-col items-center justify-center min-h-[60vh] fixed inset-0">
        <Image
          src="/image/logo.png"
          alt="در حال بارگذاری جزئیات محصول..."
          width={80}
          height={80}
          className="animate-spin object-contain"
          priority
        />
        <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
           در حال بارگذاری جزئیات بنر محصول...
        </p>
      </div>
    ); // <-- بسته شدن return
  }

  return (
    <Box sx={{ p: 2 }}>
      <Toaster position="top-right" />
      <div className="flex gap-1">
        <Icon path={mdiImageEditOutline} size={1.3} />
        <h1 className="text-xl font-bold mb-4">ویرایش بنر</h1>
      </div>
      

      <form onSubmit={handleSubmit}>
        <TextField
          {...rtlStyles}
          label="عنوان"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          {...rtlStyles}
          label="توضیحات"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          {...rtlStyles}
          label="آدرس تصویر"
          value={img}
          onChange={(e) => setImg(e.target.value)}
          fullWidth
          margin="normal"
        />

        <Button
          type="submit"
          variant="contained"
          color="success"
          className="gap-1 mt-2 rounded-xl"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <CircularProgress size={20} color="inherit" className="me-2" />
              در حال ذخیره تغییرات...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              ذخیره تغییرات
            </>
          )}
        </Button>
      </form>
    </Box>
  );
}