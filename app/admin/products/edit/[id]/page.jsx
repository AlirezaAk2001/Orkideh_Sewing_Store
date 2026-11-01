"use client";

import PageLoader from "@/app/components/PageLoader";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Box, Button, TextField, MenuItem, CircularProgress } from "@mui/material";
import { Save } from "lucide-react";
import Icon from '@mdi/react';
import PageHeader from "@/app/admin/_shell/PageHeader";
import { mdiStoreEditOutline, mdiStoreOutline } from '@mdi/js';
import ProductImagesField from "@/app/components/ProductImagesField";
import { productImages } from "@/lib/productImages";

export default function EditProduct() {
  const router = useRouter();
  const { id } = useParams();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [gallery, setGallery] = useState([]); // تصویرها؛ اولی تصویر اصلی (image)، بقیه گالری (images)
  const [uploading, setUploading] = useState(false);
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
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState({});

  // rtlStyles کامل مثل بنرها
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

  // rtlSelectStyles برای فیلد select (مانند بنرها که select نداشت، اما اینجا نیاز داریم)
  const rtlSelectStyles = {
    InputLabelProps: {
      sx: {
        transformOrigin: "right !important",
        left: "inherit !important",
        right: "2.5rem !important",
      },
    },
    sx: {
      "& legend": { textAlign: "right" },
      "& .MuiOutlinedInput-root": {
        fontFamily: "Vazirmatn, sans-serif",
        borderRadius: "10px",
        transition: "box-shadow .2s ease",
        paddingRight: "14px !important",
        "&:hover fieldset": { borderColor: "#6366f1" },
        "&.Mui-focused fieldset": {
          borderColor: "#6366f1",
          borderWidth: "2px",
        },
        "&.Mui-focused": {
          boxShadow: "0 0 0 3px rgba(99,102,241,.12)",
        },
      },
      "& .MuiInputLabel-root": { fontFamily: "Vazirmatn, sans-serif" },
      "& .MuiInputLabel-root.Mui-focused": { color: "#6366f1" },
      "& input, & textarea": { fontFamily: "Vazirmatn, sans-serif" },
      "& .MuiSelect-select": {
        paddingRight: "32px !important",
      },
    },
  };

  // محاسبه قیمت نهایی (بدون تغییر)
  useEffect(() => {
    if (price && !isNaN(parseFloat(price))) {
      const parsedPrice = parseFloat(price);
      const parsedDiscount =
        discount && !isNaN(parseFloat(discount)) ? parseFloat(discount) : 0;
      const calculatedFinalPrice = parsedPrice * (1 - parsedDiscount / 100);
      setFinalPrice(calculatedFinalPrice.toFixed(2));
    } else {
      setFinalPrice("");
    }
  }, [price, discount]);

  // دریافت دسته‌بندی‌ها (بدون تغییر)
  useEffect(() => {
    axios
      .get("/api/admin/categories")
      .then((res) => setCategories(res.data))
      .catch(() => toast.error("خطا در دریافت دسته‌بندی‌ها"));
  }, []);

  // دریافت اطلاعات محصول (بدون تغییر)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/admin/products/${id}`);
        // صفر یعنی «ناموجود» و باید به‌صورت ۰ نمایش داده شود؛ فقط null خالی است
        const loaded = {
          name: data.name || "",
          price: data.price || "",
          stock: data.stock ?? "",
          categoryId: data.categoryId || "",
          gallery: productImages(data).join("\n"),
          additionalFeatures: data.additionalFeatures || "",
          material: data.material || "",
          size: data.size || "",
          color: data.color || "",
          suitableFor: data.suitableFor || "",
          discount: data.discount || "",
          weight: data.weight || "",
          voltage: data.voltage || "",
          powerConsumption: data.powerConsumption || "",
        };
        setName(loaded.name);
        setPrice(loaded.price);
        setStock(loaded.stock);
        setCategoryId(loaded.categoryId);
        setGallery(productImages(data));
        setAdditionalFeatures(loaded.additionalFeatures);
        setMaterial(loaded.material);
        setSize(loaded.size);
        setColor(loaded.color);
        setSuitableFor(loaded.suitableFor);
        setDiscount(loaded.discount);
        setWeight(loaded.weight);
        setVoltage(loaded.voltage);
        setPowerConsumption(loaded.powerConsumption);
        setFinalPrice(data.finalPrice || data.price || "");
        setInitialData(loaded);
      } catch (err) {
        toast.error("خطا در دریافت اطلاعات محصول");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // اگر هر فیلد قابل‌ویرایشی عوض شده باشد دکمهٔ ذخیره فعال می‌شود (قبلاً فقط نام، قیمت، دسته و تصویر حساب می‌شد)
  const current = {
    name, price, stock, categoryId, gallery: gallery.join("\n"), additionalFeatures, material,
    size, color, suitableFor, discount, weight, voltage, powerConsumption,
  };
  const hasChanged = Object.keys(initialData).some(
    (key) => String(current[key] ?? "") !== String(initialData[key] ?? "")
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) return toast.error("نام و قیمت محصول الزامی است");
    if (gallery.length === 0) return toast.error("حداقل یک تصویر برای محصول لازم است");

    setIsSaving(true);
    try {
      const payload = {
        id: parseInt(id),
        name,
        price: parseFloat(price),
        stock: stock === "" ? null : parseInt(stock),
        categoryId: categoryId ? parseInt(categoryId) : null,
        image: gallery[0],
        images: gallery.slice(1),
        additionalFeatures,
        material,
        size,
        color,
        suitableFor,
        discount: discount ? parseFloat(discount) : null,
        weight,
        voltage,
        powerConsumption,
        finalPrice:
          finalPrice && !isNaN(parseFloat(finalPrice))
            ? parseFloat(finalPrice)
            : parseFloat(price),
      };

      await axios.put("/api/admin/products", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("محصول با موفقیت ویرایش شد");
      router.push("/admin/products");
    } catch (err) {
      toast.error("خطا در ویرایش محصول");
    } finally {
      setIsSaving(false);
    }
  };

  // ⏳ حالت لودینگ (دقیقاً مشابه بنرها)
  if (loading) {
    return (
      <PageLoader className="min-h-[60vh]" label="در حال بارگذاری جزئیات محصول..." />
    );
  }

  // بخش UI بازطراحی شده مطابق با استایل بنرها
  return (
    <>
      <style>{`
        /* ── کلیات ── */
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
          transition: all .25s ease !important;
          letter-spacing: .01em !important;
        }
        button.save-btn:not(:hover) {
          box-shadow: 0 4px 14px rgba(22,163,74,.3);
        }
        .save-btn:disabled {
          background: linear-gradient(135deg, #94a3b8, #64748b) !important;
          box-shadow: none !important;
        }

      `}</style>

      <Box sx={{ p: 0 }} dir="rtl">

        <PageHeader icon={<Icon path={mdiStoreEditOutline} size="22px" />} title="ویرایش اطلاعات محصول" />

        {/* ── کارت اصلی ── */}
        <div className="product-card">
          <div className="product-card-header">
            <Icon path={mdiStoreOutline} size={0.9} />
            <h2>اطلاعات محصول</h2>
          </div>

          <div className="product-card-body">
            {/* فرم (کلیه فیلدها با چیدمان منعطف اما کاملاً مشابه استایل بنرها) */}
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
                  label="قیمت (تومان)"
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
                  label="دسته‌بندی"
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

              {/* ردیف ۳: تصویرهای محصول (آپلود چند تصویر؛ اولی تصویر اصلی) */}
              <ProductImagesField value={gallery} onChange={setGallery} onBusyChange={setUploading} disabled={isSaving} />

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
                  label="قیمت نهایی (فقط خواندنی)"
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
                  label="جنس"
                  value={material}
                  placeholder="مثال: فولادی"
                  onChange={(e) => setMaterial(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  {...rtlStyles}
                  label="ابعاد"
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
                  label="رنگ"
                  value={color}
                  placeholder="مثال: سفید"
                  onChange={(e) => setColor(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  {...rtlStyles}
                  label="وزن (گرم)"
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
                  label="ولتاژ (ولت)"
                  value={voltage}
                  placeholder="مثال: ۲۲۰"
                  onChange={(e) => setVoltage(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  {...rtlStyles}
                  label="توان مصرفی (وات)"
                  value={powerConsumption}
                  placeholder="مثال: ۵۰۰"
                  onChange={(e) => setPowerConsumption(e.target.value)}
                  fullWidth
                  margin="normal"
                />
              </Box>

              {/* ویژگی‌های اضافی */}
              <TextField
                {...rtlStyles}
                label="ویژگی‌های اضافی"
                value={additionalFeatures}
                onChange={(e) => setAdditionalFeatures(e.target.value)}
                placeholder="توضیحات تکمیلی راجب محصول"
                fullWidth
                multiline
                margin="normal"
              />

              {/* مناسب برای */}
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
                disabled={isSaving || uploading || !hasChanged}
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