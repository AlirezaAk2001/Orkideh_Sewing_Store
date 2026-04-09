"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Save, Blocks } from "lucide-react";
import { Button, CircularProgress, TextField, Box } from "@mui/material";

export default function AddCategory() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    if (!name || !slug) {
      toast.error("نام و اسلاگ الزامی است");
      setIsSaving(false);
      return;
    }

    try {
      await axios.post("/api/admin/categories", { name, slug, image });
      toast.success("دسته‌بندی با موفقیت اضافه شد");
      router.push("/admin/categories");
    } catch (err) {
      console.error(err);
      toast.error("خطا در افزودن دسته‌بندی");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Toaster position="top-right" />
      <div className="flex gap-1">
        <Blocks className="w-7 h-7" />
        <h1 className="text-xl font-bold mb-4">افزودن دسته‌بندی جدید</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          {...rtlStyles}
          type="text"
          label="نام دسته‌بندی"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
        />
        <TextField
          {...rtlStyles}
          type="text"
          label="اسلاگ دسته‌بندی"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="border p-2 rounded"
        />
        <TextField
          {...rtlStyles}
          type="text"
          label="آدرس تصویر (اختیاری)"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="border p-2 rounded"
        />

        <Button
          type="submit"
          variant="contained"
          color="success"
          className="gap-1 rounded-xl"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <CircularProgress size={20} color="inherit" className="me-2" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              ذخیره
            </>
          )}
        </Button>
      </form>
    </Box>
  );
}