"use client";

import PageLoader from "@/app/components/PageLoader";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { AlignLeft, Banknote, Clapperboard, ClipboardList, ImagePlus, PackageCheck, Ruler, Shapes } from "lucide-react";
import PageHeader from "@/app/admin/_shell/PageHeader";
import FormSection from "@/app/admin/_form/FormSection";
import { TextInput, TextArea, SelectInput } from "@/app/admin/_form/Fields";
import SaveBar from "@/app/admin/_form/SaveBar";
import ProductCardPreview from "@/app/admin/_form/ProductCardPreview";
import ProductImagesField from "@/app/components/ProductImagesField";
import ProductVideoField from "@/app/components/ProductVideoField";
import FormNav from "@/app/admin/_form/FormNav";
import UnsavedGuard from "@/app/admin/_form/UnsavedGuard";
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
          video: data.video || "",
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
        setVideo(loaded.video);
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
    name, price, stock, categoryId, gallery: gallery.join("\n"), video, additionalFeatures, material,
    size, color, suitableFor, discount, weight, voltage, powerConsumption,
  };
  const hasChanged = Object.keys(initialData).some(
    (key) => String(current[key] ?? "") !== String(initialData[key] ?? "")
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) return toast.error("نام و قیمت محصول الزامی است");
    // دسته‌بندی را قبلاً required بومی سلکت می‌گرفت؛ حالا فرم بدون اعتبارسنجی بومی است (noValidate)
    if (!String(categoryId).trim()) return toast.error("دسته‌بندی محصول را انتخاب کنید");
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
        // ویدیو فقط وقتی عوض شده فرستاده می‌شود ("" = حذف)؛ فرستاده نشدنش یعنی ویدیوی فعلی همان می‌ماند
        ...(video !== (initialData.video ?? "") && { video }),
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
      <PageLoader className="h-[100cqh]" label="در حال بارگذاری جزئیات محصول..." />
    );
  }

  // نوار پایین می‌گوید تغییری هست یا نه، و اگر چیزی از موارد الزامی خالی شده، کدام
  const missing = [!String(name).trim() && "نام", !String(price).trim() && "قیمت", !String(categoryId).trim() && "دسته‌بندی", gallery.length === 0 && "تصویر"].filter(Boolean);
  const busy = uploading || videoUploading;
  // نوار بخش‌ها: هر بخش با شناسهٔ همان FormSection؛ «done» از stateهای فرم می‌آید و بخش‌های اختیاری در حلقهٔ پیشرفت حساب نمی‌شوند
  const filled = (value) => String(value ?? "").trim() !== "";
  const navItems = [
    { id: "sec-info", label: "اطلاعات اصلی", done: filled(name) && filled(categoryId) },
    { id: "sec-price", label: "قیمت و موجودی", done: filled(price) },
    { id: "sec-images", label: "تصاویر", done: gallery.length > 0 },
    { id: "sec-video", label: "ویدیو", optional: true, done: Boolean(video) },
    { id: "sec-specs", label: "مشخصات", optional: true, done: [material, size, color, weight, voltage, powerConsumption].some(filled) },
    { id: "sec-desc", label: "توضیحات", optional: true, done: filled(additionalFeatures) || filled(suitableFor) },
  ];
  const status = busy
    ? `در حال آپلود ${videoUploading ? "ویدیو" : "تصویر"}؛ ذخیره بعد از پایان آپلود فعال می‌شود`
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

      {/* تغییر ذخیره‌نشده داریم؟ رفتن به صفحهٔ دیگر تأیید می‌خواهد */}
      <UnsavedGuard when={hasChanged && !isSaving} />

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
          label="ذخیرهٔ تغییرات"
          backHref="/admin/products"
          saving={isSaving}
          disabled={busy || !hasChanged}
          tone={busy || missing.length || hasChanged ? "dirty" : "idle"}
          status={status}
        />
      </form>
    </>
  );
}
