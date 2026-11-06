"use client";

import PageLoader from "@/app/components/PageLoader";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { AlignLeft, Banknote, ClipboardList, ImagePlus, PackageCheck, Ruler } from "lucide-react";
import PageHeader from "@/app/admin/_shell/PageHeader";
import FormSection from "@/app/admin/_form/FormSection";
import { TextInput, TextArea, SelectInput } from "@/app/admin/_form/Fields";
import SaveBar from "@/app/admin/_form/SaveBar";
import ProductCardPreview from "@/app/admin/_form/ProductCardPreview";
import ProductImagesField from "@/app/components/ProductImagesField";
import { productImages } from "@/lib/productImages";

const fa = (n) => Number(n).toLocaleString("fa-IR");

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

  // نوار پایین می‌گوید تغییری هست یا نه، و اگر چیزی از موارد الزامی خالی شده، کدام
  const missing = [!String(name).trim() && "نام", !String(price).trim() && "قیمت", !String(categoryId).trim() && "دسته‌بندی", gallery.length === 0 && "تصویر"].filter(Boolean);
  const status = uploading
    ? "در حال آپلود تصویر؛ ذخیره بعد از پایان آپلود فعال می‌شود"
    : missing.length
    ? `هنوز لازم است: ${missing.join("، ")}`
    : hasChanged
    ? "تغییرات ذخیره‌نشده دارید"
    : "تغییری اعمال نشده است";

  return (
    <>
      <PageHeader
        icon={<PackageCheck className="h-[22px] w-[22px]" aria-hidden="true" />}
        title="ویرایش اطلاعات محصول"
        subtitle={initialData.name ? <>در حال ویرایش «<b>{initialData.name}</b>»</> : undefined}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4">
            <FormSection index={0} icon={ClipboardList} title="اطلاعات اصلی" hint="نام و دسته‌بندی در فهرست و صفحهٔ محصول دیده می‌شود">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="نام محصول" required placeholder="مثال: چرخ خیاطی برادر" value={name} onChange={(e) => setName(e.target.value)} />
                <SelectInput label="دسته‌بندی محصول" required placeholder="انتخاب دسته‌بندی" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </SelectInput>
              </div>
            </FormSection>

            <FormSection index={1} icon={Banknote} title="قیمت و موجودی" hint="قیمت نهایی از قیمت و تخفیف خودکار حساب می‌شود">
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <TextInput
                  label="قیمت محصول"
                  required
                  ltr
                  suffix="تومان"
                  type="number"
                  inputMode="numeric"
                  placeholder="12500000"
                  hint={price && !isNaN(parseFloat(price)) ? `${fa(price)} تومان` : undefined}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <TextInput label="تخفیف" ltr suffix="٪" type="number" inputMode="decimal" placeholder="5" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                <TextInput
                  label="قیمت نهایی"
                  ltr
                  suffix="تومان"
                  readOnly
                  placeholder="به‌صورت خودکار"
                  hint="فقط خواندنی"
                  value={finalPrice && !isNaN(parseFloat(finalPrice)) ? fa(finalPrice) : ""}
                />
                <TextInput label="موجودی" ltr suffix="عدد" type="number" inputMode="numeric" placeholder="2" hint="خالی یعنی موجودی پیگیری نمی‌شود" value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
            </FormSection>

            <FormSection index={2} icon={ImagePlus} title="تصاویر محصول" hint="چند تصویر را با هم رها کنید؛ اولین تصویر، تصویر اصلی است">
              <ProductImagesField value={gallery} onChange={setGallery} onBusyChange={setUploading} disabled={isSaving} />
            </FormSection>

            <FormSection index={3} icon={Ruler} title="مشخصات" hint="همه اختیاری‌اند و در صفحهٔ محصول نشان داده می‌شوند">
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                <TextInput label="جنس محصول" placeholder="مثال: فولادی" value={material} onChange={(e) => setMaterial(e.target.value)} />
                <TextInput label="ابعاد محصول" placeholder="مثال: ۱۲ × ۱۸ × ۱۶ سانتی‌متر" value={size} onChange={(e) => setSize(e.target.value)} />
                <TextInput label="رنگ محصول" placeholder="مثال: سفید" value={color} onChange={(e) => setColor(e.target.value)} />
                <TextInput label="وزن محصول" suffix="گرم" placeholder="مثال: ۱۲۰" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <TextInput label="ولتاژ محصول" suffix="ولت" placeholder="مثال: ۱۰" value={voltage} onChange={(e) => setVoltage(e.target.value)} />
                <TextInput label="توان مصرفی محصول" suffix="وات" placeholder="مثال: ۲۲۰" value={powerConsumption} onChange={(e) => setPowerConsumption(e.target.value)} />
              </div>
            </FormSection>

            <FormSection index={4} icon={AlignLeft} title="توضیحات" hint="متن آزاد؛ زیر عکس در صفحهٔ محصول می‌آید">
              <div className="grid gap-4 lg:grid-cols-2">
                <TextArea label="ویژگی‌های اضافی محصول" rows={4} placeholder="توضیحات تکمیلی دربارهٔ محصول" value={additionalFeatures} onChange={(e) => setAdditionalFeatures(e.target.value)} />
                <TextArea label="مناسب برای" rows={4} placeholder="مثال: مناسب برای دوخت‌ودوز خانگی" value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)} />
              </div>
            </FormSection>
          </div>

          <ProductCardPreview name={name} price={price} discount={discount} finalPrice={finalPrice} stock={stock} gallery={gallery} category={categories.find((cat) => String(cat.id) === String(categoryId))} />
        </div>

        <SaveBar
          label="ذخیرهٔ تغییرات"
          backHref="/admin/products"
          saving={isSaving}
          disabled={uploading || !hasChanged}
          tone={uploading || missing.length || hasChanged ? "dirty" : "idle"}
          status={status}
        />
      </form>
    </>
  );
}
