"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Image from 'next/image'
import { Button, CircularProgress, TextField, MenuItem } from "@mui/material";
import { Save } from "lucide-react";
import Icon from '@mdi/react';
import { mdiStoreEditOutline } from '@mdi/js';

export default function EditProduct() {
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
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState({ name: "", price: "", categoryId: "", image: "" });

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

  const router = useRouter();
  const { id } = useParams();

  // محاسبه قیمت نهایی
  useEffect(() => {
    if (price && !isNaN(parseFloat(price))) {
      const parsedPrice = parseFloat(price);
      const parsedDiscount =
        discount && !isNaN(parseFloat(discount)) ? parseFloat(discount) : 0;
      const calculatedFinalPrice = parsedPrice * (1 - parsedDiscount / 100);
      setFinalPrice(calculatedFinalPrice);
    } else {
      setFinalPrice("");
    }
  }, [price, discount]);

  // دریافت دسته‌بندی‌ها
  useEffect(() => {
    axios
      .get("/api/admin/categories")
      .then((res) => setCategories(res.data))
      .catch(() => toast.error("خطا در دریافت دسته‌بندی‌ها"));
  }, []);

  // دریافت اطلاعات محصول
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/admin/products/${id}`);
        setName(data.name || "");
        setPrice(data.price || "");
        setStock(data.stock || "");
        setCategoryId(data.categoryId || "");
        setImage(data.image || "");
        setAdditionalFeatures(data.additionalFeatures || "");
        setMaterial(data.material || "");
        setSize(data.size || "");
        setColor(data.color || "");
        setSuitableFor(data.suitableFor || "");
        setDiscount(data.discount || "");
        setWeight(data.weight || "");
        setVoltage(data.voltage || "");
        setPowerConsumption(data.powerConsumption || "");
        setFinalPrice(data.finalPrice || data.price || "");
        setInitialData({          // 👈 اضافه کن
          name: data.name || "",
          categoryId: data.categoryId || "",
          price: data.price || "",
          image: data.image || "",
        });
      } catch (err) {
        toast.error("خطا در دریافت اطلاعات محصول");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) return toast.error("نام و قیمت محصول الزامی است");

    setIsSaving(true);
    try {
      const payload = {
        id: parseInt(id),
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
        weight,
        voltage,
        powerConsumption,
        finalPrice:
          finalPrice && !isNaN(parseFloat(finalPrice))
            ? parseFloat(finalPrice)
            : parseFloat(price),
      };

      await axios.put("/api/admin/products", payload);
      toast.success("محصول با موفقیت ویرایش شد");
      router.push("/admin/products");
    } catch (err) {
      toast.error("خطا در ویرایش محصول");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
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
          در حال بارگذاری جزئیات محصول...
        </p>
      </div>
    ); // <-- بسته شدن return

  const hasChanged =
    name !== initialData.name ||
    categoryId !== initialData.categoryId ||
    price !== initialData.price ||
    image !== initialData.image;

  return (
    <div className="p-4 max-w-lg mx-auto" dir="rtl">
      <Toaster position="top-right" />
      <div className="flex gap-1">
        <Icon path={mdiStoreEditOutline} size={1.3} />
        <h1 className="text-xl font-bold mb-4">ویرایش محصول</h1>
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
          disabled={isSaving || !hasChanged}
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
    </div>
  );
}