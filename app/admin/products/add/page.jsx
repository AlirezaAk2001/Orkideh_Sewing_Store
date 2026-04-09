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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          {...rtlStyles}
          label="نام محصول"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="قیمت"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          fullWidth
          type="number"
        />
        <TextField
          {...rtlStyles}
          label="موجودی"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          fullWidth
          type="number"
        />
        <TextField
          {...rtlStyles}
          select
          label="دسته‌بندی"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
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
          onChange={(e) => setImage(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="تخفیف (%)"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          fullWidth
          type="number"
        />
        <TextField
          {...rtlStyles}
          label="قیمت نهایی (فقط خواندنی)"
          value={finalPrice}
          fullWidth
          InputProps={{ readOnly: true }}
        />
        <TextField
          {...rtlStyles}
          label="ویژگی‌های اضافی"
          value={additionalFeatures}
          onChange={(e) => setAdditionalFeatures(e.target.value)}
          fullWidth
          multiline
        />
        <TextField
          {...rtlStyles}
          label="جنس"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="ابعاد"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="رنگ"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="وزن (گرم)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="ولتاژ (مثل 220V)"
          value={voltage}
          onChange={(e) => setVoltage(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="توان مصرفی (مثل 500W)"
          value={powerConsumption}
          onChange={(e) => setPowerConsumption(e.target.value)}
          fullWidth
        />
        <TextField
          {...rtlStyles}
          label="مناسب برای"
          value={suitableFor}
          onChange={(e) => setSuitableFor(e.target.value)}
          fullWidth
          multiline
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
    </div>
  );
}