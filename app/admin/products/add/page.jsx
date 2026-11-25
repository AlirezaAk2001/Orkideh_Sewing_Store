"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { AlignLeft, Banknote, Clapperboard, ClipboardList, ImagePlus, PackagePlus, Ruler, Shapes } from "lucide-react";
import PageHeader from "@/app/admin/_shell/PageHeader";
import FormSection from "@/app/admin/_form/FormSection";
import { TextInput, TextArea, SelectInput } from "@/app/admin/_form/Fields";
import SaveBar from "@/app/admin/_form/SaveBar";
import ProductCardPreview from "@/app/admin/_form/ProductCardPreview";
import ProductImagesField from "@/app/components/ProductImagesField";
import ProductVideoField from "@/app/components/ProductVideoField";
import FormNav from "@/app/admin/_form/FormNav";
import UnsavedGuard from "@/app/admin/_form/UnsavedGuard";

const fa = (n) => Number(n).toLocaleString("fa-IR");

export default function AddProduct() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [gallery, setGallery] = useState([]); // تصویرها؛ اولی تصویر اصلی (image)، بقیه گالری (images)
  const [uploading, setUploading] = useState(false);
  const [video, setVideo] = useState(""); // ویدیوی کوتاه اختیاری (مسیر فایل آپلودشده)
  const [videoUploading, setVideoUploading] = useState(false);
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

  const isFormFilled = name.trim() || price.trim() || String(categoryId).trim() || gallery.length > 0;

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
    // دسته‌بندی را قبلاً required بومی سلکت می‌گرفت؛ حالا فرم بدون اعتبارسنجی بومی است (noValidate)
    if (!String(categoryId).trim()) {
      toast.error("دسته‌بندی محصول را انتخاب کنید");
      return;
    }
    if (gallery.length === 0) {
      toast.error("حداقل یک تصویر برای محصول اضافه کنید");
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
          image: gallery[0],
          images: gallery.slice(1),
          ...(video && { video }),
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

  // نوار پایین به‌جای فقط «غیرفعال»، می‌گوید چه چیزی کم است
  const missing = [!name.trim() && "نام", !price.trim() && "قیمت", !String(categoryId).trim() && "دسته‌بندی", gallery.length === 0 && "تصویر"].filter(Boolean);
  const busy = uploading || videoUploading;
  // نوار بخش‌ها: هر بخش با شناسهٔ همان FormSection؛ «done» از stateهای فرم می‌آید و بخش‌های اختیاری در حلقهٔ پیشرفت حساب نمی‌شوند
  const navItems = [
    { id: "sec-info", label: "اطلاعات اصلی", done: Boolean(name.trim() && String(categoryId).trim()) },
    { id: "sec-price", label: "قیمت و موجودی", done: Boolean(price.trim()) },
    { id: "sec-images", label: "تصاویر", done: gallery.length > 0 },
    { id: "sec-video", label: "ویدیو", optional: true, done: Boolean(video) },
    { id: "sec-specs", label: "مشخصات", optional: true, done: [material, size, color, weight, voltage, powerConsumption].some((v) => String(v).trim()) },
    { id: "sec-desc", label: "توضیحات", optional: true, done: Boolean(additionalFeatures.trim() || suitableFor.trim()) },
  ];
  const status = busy
    ? `در حال آپلود ${videoUploading ? "ویدیو" : "تصویر"}؛ ذخیره بعد از پایان آپلود فعال می‌شود`
    : !isFormFilled
    ? "برای ذخیره، اطلاعات محصول را وارد کنید"
    : missing.length
    ? `هنوز لازم است: ${missing.join("، ")}`
    : "همه‌چیز آمادهٔ ذخیره است";

  return (
    <>
      <PageHeader icon={<PackagePlus className="h-[22px] w-[22px]" aria-hidden="true" />} title="افزودن محصول جدید" subtitle="اطلاعات را در بخش‌های زیر وارد کنید؛ نوار پایین همیشه در دسترس است." />

      {/* با هر تغییر ذخیره‌نشده، رفتن به صفحهٔ دیگر تأیید می‌خواهد */}
      <UnsavedGuard when={Boolean(isFormFilled) && !isSaving} />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormNav items={navItems} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4">
            <FormSection id="sec-info" index={0} icon={ClipboardList} title="اطلاعات اصلی" hint="نام و دسته‌بندی در فهرست و صفحهٔ محصول دیده می‌شود">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="نام محصول" required placeholder="مثال: چرخ خیاطی برادر" value={name} onChange={(e) => setName(e.target.value)} />
                <SelectInput
                  label="دسته‌بندی محصول"
                  required
                  placeholder="انتخاب دسته‌بندی"
                  icon={Shapes}
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categories.map((cat) => ({ value: String(cat.id), label: cat.name, image: cat.image }))}
                />
              </div>
            </FormSection>

            <FormSection id="sec-price" index={1} icon={Banknote} title="قیمت و موجودی" hint="قیمت نهایی از قیمت و تخفیف خودکار حساب می‌شود">
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

            <FormSection id="sec-images" index={2} icon={ImagePlus} title="تصاویر محصول" hint="چند تصویر را با هم رها کنید؛ اولین تصویر، تصویر اصلی است">
              <ProductImagesField value={gallery} onChange={setGallery} onBusyChange={setUploading} disabled={isSaving} />
            </FormSection>

            <FormSection id="sec-video" index={3} icon={Clapperboard} title="ویدیوی محصول" hint="اختیاری؛ یک ویدیوی کوتاه که در صفحهٔ محصول نشان داده می‌شود">
              <ProductVideoField value={video} onChange={setVideo} onBusyChange={setVideoUploading} disabled={isSaving} />
            </FormSection>

            <FormSection id="sec-specs" index={4} icon={Ruler} title="مشخصات" hint="همه اختیاری‌اند و در صفحهٔ محصول نشان داده می‌شوند">
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                <TextInput label="جنس محصول" placeholder="مثال: فولادی" value={material} onChange={(e) => setMaterial(e.target.value)} />
                <TextInput label="ابعاد محصول" placeholder="مثال: ۱۲ × ۱۸ × ۱۶ سانتی‌متر" value={size} onChange={(e) => setSize(e.target.value)} />
                <TextInput label="رنگ محصول" placeholder="مثال: سفید" value={color} onChange={(e) => setColor(e.target.value)} />
                <TextInput label="وزن محصول" suffix="گرم" placeholder="مثال: ۱۲۰" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <TextInput label="ولتاژ محصول" suffix="ولت" placeholder="مثال: ۱۰" value={voltage} onChange={(e) => setVoltage(e.target.value)} />
                <TextInput label="توان مصرفی محصول" suffix="وات" placeholder="مثال: ۲۲۰" value={powerConsumption} onChange={(e) => setPowerConsumption(e.target.value)} />
              </div>
            </FormSection>

            <FormSection id="sec-desc" index={5} icon={AlignLeft} title="توضیحات" hint="متن آزاد؛ زیر عکس در صفحهٔ محصول می‌آید">
              <div className="grid gap-4 lg:grid-cols-2">
                <TextArea label="ویژگی‌های اضافی محصول" rows={4} placeholder="توضیحات تکمیلی دربارهٔ محصول" value={additionalFeatures} onChange={(e) => setAdditionalFeatures(e.target.value)} />
                <TextArea label="مناسب برای" rows={4} placeholder="مثال: مناسب برای دوخت‌ودوز خانگی" value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)} />
              </div>
            </FormSection>
          </div>

          <ProductCardPreview name={name} price={price} discount={discount} finalPrice={finalPrice} stock={stock} gallery={gallery} category={categories.find((cat) => String(cat.id) === String(categoryId))} />
        </div>

        <SaveBar
          label="ذخیرهٔ محصول"
          backHref="/admin/products"
          saving={isSaving}
          disabled={busy || !isFormFilled}
          tone={busy ? "dirty" : !isFormFilled ? "idle" : missing.length ? "dirty" : "ready"}
          status={status}
        />
      </form>
    </>
  );
}
