"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Box, Button, TextField, MenuItem, CircularProgress } from "@mui/material";
import { Save } from "lucide-react";
import Icon from '@mdi/react';
import { mdiStorePlusOutline, mdiImagePlusOutline, mdiImageOffOutline, mdiStoreOutline } from '@mdi/js';
import { getImagePath } from "@/app/utils/getImagePath";
import AppImage from "@/app/components/AppImage";

export default function AddProduct() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState("");
  const [previewImg, setPreviewImg] = useState("");
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [additionalFeatures, setAdditionalFeatures] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [suitableFor, setSuitableFor] = useState("");
  const [discount, setDiscount] = useState("");
  const [weight, setWeight] = useState("");
  const [voltage, setVoltage] = useState("");
  const [powerConsumption, setPowerConsumption] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef(null);

  const isFormFilled = name.trim() || price.trim() || String(categoryId).trim() || image.trim();

  const rtlSelectStyles = {
    InputLabelProps: {
      sx: {
        transformOrigin: "right !important",
        left: "inherit !important",
        right: "2.5rem !important", // فضای بیشتر برای آیکون select
      },
    },
    sx: {
      "& legend": { textAlign: "right" },
      "& .MuiOutlinedInput-root": {
        fontFamily: "Vazirmatn, sans-serif",
        borderRadius: "10px",
        transition: "box-shadow .2s ease",
        paddingRight: "14px !important", // کاهش padding سمت راست
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
      // تنظیم موقعیت آیکون select
      "& .MuiSelect-select": {
        paddingRight: "32px !important",
      },
    },
  };

  // محاسبه خودکار قیمت نهایی
  useEffect(() => {
    if (price && discount) {
      const calculatedFinalPrice =
        parseFloat(price) * (1 - parseFloat(discount) / 100);
      setFinalPrice(calculatedFinalPrice.toFixed(2));
    } else {
      setFinalPrice(price || "");
    }
  }, [price, discount]);

  // دریافت دسته‌بندی‌ها
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get("/api/admin/categories");
        setCategories(data);
      } catch (err) {
        console.error(err);
        toast.error("خطا در دریافت دسته‌بندی‌ها");
      }
    };
    fetchCategories();
  }, []);

  // Debounce برای پیش‌نمایش تصویر
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

  // ذخیره محصول جدید
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error("نام و قیمت محصول الزامی است");
      return;
    }

    setIsSaving(true);

    try {
      await axios.post(
        "/api/admin/products",
        {
          name,
          price: parseFloat(price),
          stock: stock === "" ? null : parseInt(stock),
          categoryId: categoryId ? parseInt(categoryId) : null,
          image,
          additionalFeatures,
          material,
          size,
          color,
          suitableFor,
          discount: discount ? parseFloat(discount) : null,
          weight: weight || null,
          finalPrice: finalPrice ? parseFloat(finalPrice) : null,
          voltage: voltage || null,
          powerConsumption: powerConsumption || null,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success("محصول با موفقیت اضافه شد");
      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      toast.error("خطا در افزودن محصول");
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <>
      <style>{`
        .product-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,.08);
          overflow: hidden;
        }

        /* ── هدر کارت ── */
        .product-card-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #f1f5f9;
        }
        .product-card-header h2 {
          font-family: Vazirmatn, sans-serif;
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          color: #f1f5f9;
        }

        /* ── بدنه کارت ── */
        .product-card-body {
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

        .product-header-card {
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
        <div className="product-header-card">
          <Icon path={mdiStorePlusOutline} size={1} />
          افزودن محصول جدید
        </div>

        {/* ── کارت اصلی ── */}
        <div className="product-card">
          <div className="product-card-header">
            <Icon path={mdiStoreOutline} size={0.9} />
            <h2>اطلاعات محصول</h2>
          </div>

          <div className="product-card-body">
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
                <AppImage
                  key={previewImg}
                  src={getImagePath(previewImg)}
                  alt="پیش‌نمایش محصول"
                  fill
                  sizes="(max-width: 1000px) 100vw, 1000px"
                  priority
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
                  <span>{imgError ? "تصویر یافت نشد" : "پیش‌نمایش تصویر محصول"}</span>
                </div>
              )}
            </div>

            {/* فرم */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* ردیف ۱: نام محصول | قیمت */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  {...rtlStyles}
                  label="نام محصول"
                  placeholder="مثال: چرخ خیاطی برادر"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  margin="normal"
                />
                <TextField
                  {...rtlStyles}
                  label="قیمت محصول (تومان)"
                  placeholder="مثال: ۱۲,۵۰۰,۰۰۰"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  fullWidth
                  type="number"
                  margin="normal"
                />
              </Box>

              {/* ردیف ۲: موجودی | دسته‌بندی */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  {...rtlStyles}
                  label="موجودی (عدد)"
                  placeholder="مثال: ۲"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  fullWidth
                  type="number"
                  margin="normal"
                />
                <TextField
                  {...rtlSelectStyles}
                  select
                  label="دسته‌بندی محصول"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  fullWidth
                  margin="normal"
                  SelectProps={{
                    MenuProps: {
                      sx: {
                        "& .MuiMenuItem-root": {
                          fontFamily: "Vazirmatn, sans-serif",
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
                    انتخاب دسته‌بندی
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id} sx={{ fontFamily: "Vazirmatn, sans-serif" }}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* ردیف ۳: آدرس تصویر - تک ستونه */}
              <TextField
                {...rtlStyles}
                label="آدرس تصویر محصول"
                placeholder="مثال: z.png"
                value={image}
                onChange={(e) => handleImgChange(e.target.value)}
                required
                fullWidth
                margin="normal"
              />

              {/* ردیف ۴: تخفیف | قیمت نهایی */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  {...rtlStyles}
                  label="تخفیف (%)"
                  placeholder="مثال: ۵"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  fullWidth
                  type="number"
                  margin="normal"
                />
                <TextField
                  {...rtlStyles}
                  label="قیمت نهایی محصول (فقط خواندنی)"
                  value={finalPrice}
                  placeholder="به صورت خودکار"
                  fullWidth
                  margin="normal"
                  InputProps={{ readOnly: true }}
                />
              </Box>

              {/* ردیف ۵: جنس | ابعاد */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  {...rtlStyles}
                  label="جنس محصول"
                  value={material}
                  placeholder="مثال: فولادی"
                  onChange={(e) => setMaterial(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  {...rtlStyles}
                  label="ابعاد محصول"
                  value={size}
                  placeholder="مثال: ۱۲ × ۱۸ × ۱۶ سانتی متر"
                  onChange={(e) => setSize(e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Box>

              {/* ردیف ۶: رنگ | وزن */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  {...rtlStyles}
                  label="رنگ محصول"
                  value={color}
                  placeholder="مثال: سفید"
                  onChange={(e) => setColor(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  {...rtlStyles}
                  label="وزن محصول (گرم)"
                  value={weight}
                  placeholder="مثال: ۱۲۰"
                  onChange={(e) => setWeight(e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Box>

              {/* ردیف ۷: ولتاژ | توان مصرفی */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  {...rtlStyles}
                  label="ولتاژ محصول (ولت)"
                  value={voltage}
                  placeholder="مثال: ۱۰"
                  onChange={(e) => setVoltage(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  {...rtlStyles}
                  label="توان مصرفی محصول (وات)"
                  value={powerConsumption}
                  placeholder="مثال: ۲۲۰"
                  onChange={(e) => setPowerConsumption(e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Box>

              {/* ویژگی‌های اضافی - تک ستونه */}
              <TextField
                {...rtlStyles}
                label="ویژگی‌های اضافی محصول"
                value={additionalFeatures}
                onChange={(e) => setAdditionalFeatures(e.target.value)}
                placeholder="توضیحات تکمیلی راجب محصول"
                fullWidth
                multiline
                margin="normal"
              />

              {/* مناسب برای - تک ستونه */}
              <TextField
                {...rtlStyles}
                label="مناسب برای"
                value={suitableFor}
                placeholder="مثال: مناسب برای دوخت و دوز خانگی"
                onChange={(e) => setSuitableFor(e.target.value)}
                fullWidth
                multiline
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
                    ذخیره محصول
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