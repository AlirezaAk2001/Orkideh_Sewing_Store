"use client";

import { useEffect, useState } from "react";
import { Box, Button, TextField, CircularProgress } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Save } from "lucide-react";
import Image from "next/image";
import Icon from '@mdi/react';
import { mdiImageEditOutline, mdiImageOffOutline, mdiPanoramaVariantOutline } from '@mdi/js';
import { getImagePath } from "@/app/utils/getImagePath";
import AppImage from "@/app/components/AppImage";

export default function EditBannerPage() {
  const router = useRouter();
  const { id } = useParams();

  const [title,   setTitle]   = useState("");
  const [desc,    setDesc]    = useState("");
  const [img,     setImg]     = useState("");
  const [imgError, setImgError] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState({ title: "", desc: "", img: "" });

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

  // 📦 دریافت اطلاعات بنر
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch(`/api/admin/banners/${id}`);
        if (!res.ok) throw new Error("بنر پیدا نشد");
        const data = await res.json();
        setTitle(data.title || "");
        setDesc(data.desc   || "");
        setImg(data.img     || "");
        setInitialData({ title: data.title || "", desc: data.desc || "", img: data.img || "" });
      } catch {
        toast.error("خطا در دریافت اطلاعات بنر");
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, [id]);

  const hasChanged =
    title !== initialData.title ||
    desc  !== initialData.desc  ||
    img   !== initialData.img;

  const handleImgChange = (val) => {
    setImg(val);
    setImgError(false);
  };

  // 💾 ذخیره تغییرات
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ title, desc, img }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "خطا در ویرایش بنر");
      }
      toast.success("بنر با موفقیت ویرایش شد");
      router.push("/admin/banners");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ⏳ حالت لودینگ
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] fixed inset-0">
        <Image
          src="/image/logo.png"
          alt="در حال بارگذاری..."
          width={80}
          height={80}
          className="animate-spin object-contain"
          priority
        />
        <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
          در حال بارگذاری جزئیات بنر...
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .banner-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,.08);
          overflow: hidden;
        }

        /* ── هدر کارت ── */
        .banner-card-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #f1f5f9;
        }
        .banner-card-header h2 {
          font-family: Vazirmatn, sans-serif;
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          color: #f1f5f9;
        }

        /* ── بدنه کارت ── */
        .banner-card-body {
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

        /* ── اوورلی عنوان/توضیحات روی تصویر ── */
        .img-preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 55%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 14px 18px;
          pointer-events: none;
        }
        .img-preview-overlay .overlay-title {
          font-family: Vazirmatn, sans-serif;
          font-size: .95rem;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 1px 4px rgba(0,0,0,.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .img-preview-overlay .overlay-desc {
          font-family: Vazirmatn, sans-serif;
          font-size: .78rem;
          color: rgba(255,255,255,.8);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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

        .banner-header-card {
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
        <div className="banner-header-card">
          <Icon path={mdiImageEditOutline} size={1} />
          ویرایش اطلاعات بنر
        </div>

        {/* ── کارت اصلی ── */}
        <div className="banner-card">
          <div className="banner-card-header">
            <Icon path={mdiPanoramaVariantOutline} size={0.9} />
            <h2>اطلاعات بنر</h2>
          </div>

          <div className="banner-card-body">
            {/* پیش‌نمایش تصویر */}
            <div className={`img-preview-wrapper${img && !imgError ? " has-image" : ""}`}>
              {img && !imgError ? (
                <>
                  <AppImage
                    src={getImagePath(img)}
                    alt="پیش‌نمایش بنر"
                    fill
                    sizes="(max-width: 1000px) 100vw, 1000px"
                    priority
                    onError={() => setImgError(true)}
                  />
                  {(title || desc) && (
                    <div className="img-preview-overlay">
                      {title && <span className="overlay-title">{title}</span>}
                      {desc  && <span className="overlay-desc">{desc}</span>}
                    </div>
                  )}
                </>
              ) : (
                <div className="img-preview-placeholder">
                  <Icon
                    path={imgError ? mdiImageOffOutline : mdiImageEditOutline}
                    size={1.6}
                    color={imgError ? "#f87171" : "#cbd5e1"}
                  />
                  <span>{imgError ? "تصویر یافت نشد" : "پیش‌نمایش تصویر بنر"}</span>
                </div>
              )}
            </div>

            {/* فرم */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                {...rtlStyles}
                label="عنوان"
                placeholder="مثال: چرخ خیاطی ۱"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                {...rtlStyles}
                label="توضیحات"
                placeholder="مثال: هم اکنون با قیمت فوق العاده!"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                {...rtlStyles}
                label="آدرس تصویر"
                placeholder="مثال: x.png"
                value={img}
                onChange={(e) => handleImgChange(e.target.value)}
                fullWidth
                margin="normal"
              />

              <Button
                type="submit"
                variant="contained"
                className="save-btn"
                disabled={isSaving || !hasChanged}
              >
                {isSaving ? (
                  <>
                    <CircularProgress size={20} color="inherit" style={{ marginLeft: 8 }} />
                    در حال ذخیره تغییرات...
                  </>
                ) : (
                  <>
                    <Save style={{ width: 18, height: 18, marginLeft: 6 }} />
                    ذخیره تغییرات
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