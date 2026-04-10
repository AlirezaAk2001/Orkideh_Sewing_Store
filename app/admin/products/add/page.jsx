"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Button, CircularProgress, TextField, MenuItem } from "@mui/material";
import { Save } from "lucide-react";
import Icon from '@mdi/react';
import { mdiStorePlusOutline } from '@mdi/js';

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [image, setImage] = useState("");
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
  const isFormFilled = name.trim() || price.trim() || categoryId.trim() || image.trim();

  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();

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
          stock: parseInt(stock) || 0,
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

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Toaster position="top-right" />
      <div className="flex gap-1">
        <Icon path={mdiStorePlusOutline} size={1.2} />
        <h1 className="text-xl font-bold mb-4">افزودن محصول جدید</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          {...rtlStyles}
          label="نام محصول"
          value={name}
          placeholder="مثال: چرخ خیاطی برادر یا لوازم جانبی محسن"
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="قیمت(تومان)"
          value={price}
          placeholder="مثال: ۱۲,۵۰۰,۰۰۰ تومان"
          onChange={(e) => setPrice(e.target.value)}
          required
          fullWidth
          type="number"
        />
        <TextField
          {...rtlStyles}
          label="موجودی(عدد)"
          value={stock}
          placeholder="مثال: ۲ عدد: "
          onChange={(e) => setStock(e.target.value)}
          fullWidth
          type="number"
        />
        <TextField
          {...rtlStyles}
          select
          label="دسته‌بندی"
          value={categoryId}
          placeholder="مثال: چرخ خیاطی"
          onChange={(e) => setCategoryId(e.target.value)}
          required
          fullWidth
        >
          <MenuItem value="">انتخاب دسته‌بندی</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          {...rtlStyles}
          label="آدرس تصویر"
          value={image}
          placeholder="z.png"
          onChange={(e) => setImage(e.target.value)}
          required
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="تخفیف(%)"
          value={discount}
          placeholder="مثال: ۵ درصد"
          onChange={(e) => setDiscount(e.target.value)}
          fullWidth
          type="number"
        />
        <TextField
          {...rtlStyles}
          label="قیمت نهایی(فقط خواندنی)"
          value={finalPrice}
          placeholder="قیمت نهایی به صورت خودکار نمایش داده می شود"
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          {...rtlStyles}
          label="ویژگی‌های اضافی"
          value={additionalFeatures}
          onChange={(e) => setAdditionalFeatures(e.target.value)}
          placeholder="توضیحات تکمیلی راجب محصول"
          fullWidth
          multiline
        />
        <TextField
          {...rtlStyles}
          label="جنس"
          value={material}
          placeholder="مثال: فولادی"
          onChange={(e) => setMaterial(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="ابعاد"
          value={size}
          placeholder="مثال: ۱۲ × ۱۸ × ۱۶ سانتی متر"
          onChange={(e) => setSize(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="رنگ"
          value={color}
          placeholder="مثال: سفید"
          onChange={(e) => setColor(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="وزن(گرم)"
          value={weight}
          placeholder="مثال: ۱۲۰ گرم"
          onChange={(e) => setWeight(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="ولتاژ(ولت)"
          value={voltage}
          placeholder="مثال: ۱۰ ولت"
          onChange={(e) => setVoltage(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="توان مصرفی(وات)"
          value={powerConsumption}
          placeholder="مثال: ۲۲۰ وات"
          onChange={(e) => setPowerConsumption(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="مناسب برای"
          value={suitableFor}
          placeholder="مثال: مناسب برای دوخت و دوز خانگی"
          onChange={(e) => setSuitableFor(e.target.value)}
          fullWidth
          multiline
        />
        <Button
          type="submit"
          variant="contained"
          color="success"
          className="gap-1 rounded-xl"
          disabled={isSaving || !isFormFilled}
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
    </div>
  );
}