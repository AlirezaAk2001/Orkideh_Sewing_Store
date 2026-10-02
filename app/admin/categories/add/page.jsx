"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Save } from "lucide-react";
import { Button, CircularProgress, TextField, Box } from "@mui/material";
import Icon from '@mdi/react';
import { mdiImagePlusOutline, mdiImageOffOutline, mdiShapePlusOutline, mdiShapeOutline } from '@mdi/js';
import { getImagePath } from "@/app/utils/getImagePath";

export default function AddCategory() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [previewImg, setPreviewImg] = useState("");
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef(null);

  const isFormFilled = name.trim() || slug.trim() || image.trim();

  const router = useRouter();

  const handleImgChange = (val) => {
    setImage(val);
    setImgError(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setPreviewImg("");
      setImgLoading(false);
      return;
    }

    setImgLoading(true);
    debounceRef.current = setTimeout(() => {
      setPreviewImg(val.trim());
    }, 600);
  };

  useEffect(() => {
    if (!previewImg) setImgLoading(false);
  }, [previewImg]);

  const rtlStyles = {
    InputLabelProps: {
      sx: {
        transformOrigin: "right !important",
        left: "inherit !important",
        right: "1.75rem !important",
      },
    },
    sx: {
      "& legend": { textAlign: "right" },
      "& .MuiOutlinedInput-root": {
        fontFamily: "Vazirmatn, sans-serif",
        borderRadius: "10px",
        transition: "box-shadow .2s ease",
        "&:hover fieldset": { borderColor: "#6366f1" },
        "&.Mui-focused fieldset": {
          borderColor: "#6366f1",
          borderWidth: "2px",
        },
        "&.Mui-focused": {
          // boxShadow: "0 0 0 3px rgba(99,102,241,.12)",
        },
      },
      "& .MuiInputLabel-root": { fontFamily: "Vazirmatn, sans-serif" },
      "& .MuiInputLabel-root.Mui-focused": { color: "#6366f1" },
      "& input, & textarea": { fontFamily: "Vazirmatn, sans-serif" },
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
    <>
      <style>{`
        .category-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,.08);
          overflow: hidden;
        }

        /* ── هدر کارت ── */
        .category-card-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #f1f5f9;
        }
        .category-card-header h2 {
          font-family: Vazirmatn, sans-serif;
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          color: #f1f5f9;
        }

        /* ── بدنه کارت ── */
        .category-card-body {
          padding: 28px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* ── پیش‌نمایش تصویر ── */
        .img-preview-wrapper {
          width: 100%;
          aspect-ratio: 16 / 2;
          border-radius: 12px;
          overflow: hidden;
          background: #f1f5f9;
          border: 2px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          transition: border-color .25s ease, background .25s ease;
          position: relative;
        }
        .img-preview-wrapper.has-image {
          border-style: solid;
          border-color: #6366f1;
          background: #0f172a;
        }
        .img-preview-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .img-preview-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-family: Vazirmatn, sans-serif;
          font-size: .8rem;
          user-select: none;
          pointer-events: none;
        }

        /* ── دکمه ذخیره ── */
        .save-btn {
          width: 100%;
          height: 48px !important;
          border-radius: 12px !important;
          font-family: Vazirmatn, sans-serif !important;
          font-size: .95rem !important;
          font-weight: 700 !important;
          margin-top: 8px !important;
          background: linear-gradient(135deg, #16a34a, #15803d) !important;
          box-shadow: 0 4px 14px rgba(22,163,74,.3) !important;
          transition: all .25s ease !important;
          letter-spacing: .01em !important;
        }
        .save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(22,163,74,.4) !important;
        }
        .save-btn:disabled {
          background: linear-gradient(135deg, #94a3b8, #64748b) !important;
          box-shadow: none !important;
        }

        .category-header-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,.07);
          padding: 12px 20px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: Vazirmatn, sans-serif;
          font-size: 1rem;
          font-weight: 700;
        }
      `}</style>

      <Box sx={{ p: 0 }} dir="rtl">
        <Toaster position="top-right" />

        {/* ── عنوان صفحه ── */}
        <div className="category-header-card">
          <Icon path={mdiShapePlusOutline} size={1} />
          افزودن دسته‌بندی جدید
        </div>

        {/* ── کارت اصلی ── */}
        <div className="category-card">
          <div className="category-card-header">
            <Icon path={mdiShapeOutline} size={0.9} />
            <h2>اطلاعات دسته‌بندی</h2>
          </div>

          <div className="category-card-body">
            {/* پیش‌نمایش تصویر */}
            <div className={`img-preview-wrapper${previewImg && !imgError ? " has-image" : ""}`}>
              {/* اسپینر لودینگ */}
              {imgLoading && (
                <div className="img-preview-placeholder">
                  <CircularProgress size={28} sx={{ color: "#6366f1" }} />
                  <span>در حال بررسی تصویر...</span>
                </div>
              )}

              {/* تصویر واقعی — مخفی تا load بشه */}
              {!imgError && previewImg && (
                <img
                  key={previewImg}
                  src={getImagePath(previewImg)}
                  alt="پیش‌نمایش دسته‌بندی"
                  style={{ display: imgLoading ? "none" : "block" }}
                  onLoad={() => { setImgLoading(false); setImgError(false); }}
                  onError={() => { setImgLoading(false); setImgError(true); }}
                />
              )}

              {/* placeholder — وقتی نه لودینگ، نه تصویر */}
              {!imgLoading && (!previewImg || imgError) && (
                <div className="img-preview-placeholder">
                  <Icon
                    path={imgError ? mdiImageOffOutline : mdiImagePlusOutline}
                    size={1.6}
                    color={imgError ? "#f87171" : "#cbd5e1"}
                  />
                  <span>{imgError ? "تصویر یافت نشد" : "پیش‌نمایش تصویر دسته‌بندی"}</span>
                </div>
              )}
            </div>

            {/* فرم */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                {...rtlStyles}
                label="نام دسته‌بندی"
                placeholder="مثال: لامپ‌ها"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                {...rtlStyles}
                label="اسلاگ دسته‌بندی"
                placeholder="مثال: lamps"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                {...rtlStyles}
                label="آدرس تصویر (اختیاری)"
                placeholder="مثال: y.png"
                value={image}
                onChange={(e) => handleImgChange(e.target.value)}
                fullWidth
                margin="normal"
              />

              <Button
                type="submit"
                variant="contained"
                className="save-btn"
                disabled={isSaving || !isFormFilled}
              >
                {isSaving ? (
                  <>
                    <CircularProgress size={20} color="inherit" style={{ marginLeft: 8 }} />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save style={{ width: 18, height: 18, marginLeft: 6 }} />
                    ذخیره دسته‌بندی
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </Box>
    </>
  );
}