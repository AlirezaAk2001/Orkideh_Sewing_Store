"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Button, Box, TextField } from "@mui/material";
import { Save } from "@mui/icons-material";
import { Boxes } from "lucide-react"
import Image from "next/image";

export default function EditCategory() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const { id } = useParams();

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

  // بارگذاری اطلاعات دسته‌بندی فعلی
  useEffect(() => {
    let isMounted = true;

    const fetchCategory = async () => {
      try {
        const { data } = await axios.get(`/api/admin/categories/${id}`);
        if (isMounted && data) {
          setName(data.name || "");
          setSlug(data.slug || "");
          setImage(data.image || "");
        }
      } catch (err) {
        console.error("Error fetching category:", err.response?.data || err.message);
        toast.error("خطا در دریافت اطلاعات دسته‌بندی");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) fetchCategory();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !slug) {
      toast.error("نام و اسلاگ الزامی است");
      return;
    }

    setSaving(true);
    try {
      const payload = { id: parseInt(id), name, slug, image: image || null };

      await axios.put("/api/admin/categories", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      toast.success("دسته‌بندی با موفقیت ویرایش شد");
      router.push("/admin/categories");
    } catch (err) {
      console.error("Error updating category:", err.response?.data || err.message);
      toast.error(
        "خطا در ویرایش دسته‌بندی: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setSaving(false);
    }
  };

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
         در حال بارگذاری جزئیات دسته بندی...
        </p>
      </div>
    ); // <-- بسته شدن return
  }

  return (
    <Box sx={{ p: 2 }}>
      <Toaster position="top-right" />
      <div className="flex gap-1">
        <Boxes className="w-7 h-7" />
        <h1 className="text-xl font-bold mb-4">ویرایش دسته‌بندی</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          {...rtlStyles}
          type="text"
          label="نام دسته‌بندی"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
          fullWidth
        />
        <TextField
          {...rtlStyles}
          type="text"
          label="اسلاگ دسته‌بندی"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="border p-2 rounded"
          required
          fullWidth
        />
        <TextField
          {...rtlStyles}
          type="text"
          label="آدرس تصویر (اختیاری)"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="border p-2 rounded"
          fullWidth
        />

        <Button
          type="submit"
          variant="contained"
          color="success"
          disabled={saving}
          className="gap-1 rounded-xl"
        >
          <Save className="w-5 h-5" />
          {saving ? "در حال ذخیره تغییرات..." : "ذخیره تغییرات"}
        </Button>
      </form>
    </Box>
  );
}