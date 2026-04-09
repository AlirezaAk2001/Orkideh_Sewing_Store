"use client";

import { useState } from "react";
import { Box, Button, TextField, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Save } from "lucide-react";
import Icon from '@mdi/react';
import { mdiImagePlusOutline } from '@mdi/js';

export default function AddBannerPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, desc, img }),
      });

      if (!res.ok) throw new Error("خطا در ذخیره بنر");

      toast.success("بنر با موفقیت اضافه شد");
      router.push("/admin/banners");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <Box sx={{ p: 2 }}>
      <Toaster position="top-right" />
      <div className="flex gap-1">
        <Icon path={mdiImagePlusOutline} size={1.2} />
        <h1 className="text-xl font-bold mb-4">افزودن بنر جدید</h1>
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
          className="gap-1 rounded-xl"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <CircularProgress
                size={20}
                color="inherit"
                className="me-2"
              />
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