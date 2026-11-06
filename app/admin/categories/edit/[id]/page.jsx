"use client";

import PageLoader from "@/app/components/PageLoader";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ImageIcon, Shapes, SquarePen } from "lucide-react";
import PageHeader from "@/app/admin/_shell/PageHeader";
import FormSection from "@/app/admin/_form/FormSection";
import { TextInput } from "@/app/admin/_form/Fields";
import SaveBar from "@/app/admin/_form/SaveBar";
import ImagePreviewField from "@/app/admin/_form/ImagePreviewField";
import { useImagePreview } from "@/app/admin/_form/useImagePreview";

export default function EditCategory() {
  const router = useRouter();
  const { id } = useParams();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const img = useImagePreview();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState({ name: "", slug: "", image: "" });
  const { init: initImage } = img;

  const image = img.value;

  // 📦 دریافت اطلاعات دسته‌بندی
  useEffect(() => {
    let isMounted = true;

    const fetchCategory = async () => {
      try {
        const { data } = await axios.get(`/api/admin/categories/${id}`);
        if (isMounted && data) {
          setName(data.name || "");
          setSlug(data.slug || "");
          initImage(data.image || "");
          setInitialData({
            name: data.name || "",
            slug: data.slug || "",
            image: data.image || "",
          });
        }
      } catch (err) {
        console.error("Error fetching category:", err.response?.data || err.message);
        toast.error("خطا در دریافت اطلاعات دسته‌بندی");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) fetchCategory();

    return () => {
      isMounted = false;
    };
  }, [id, initImage]);

  const hasChanged =
    name !== initialData.name ||
    slug !== initialData.slug ||
    image !== initialData.image;

  // 💾 ذخیره تغییرات
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !slug) {
      toast.error("نام و اسلاگ الزامی است");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { id: parseInt(id), name, slug, image: image || null };

      await axios.put("/api/admin/categories", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      toast.success("دسته‌بندی با موفقیت ویرایش شد");
      router.push("/admin/categories");
    } catch (err) {
      console.error("Error updating category:", err.response?.data || err.message);
      toast.error(
        "خطا در ویرایش دسته‌بندی: " +
        (err.response?.data?.error || err.message)
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ⏳ حالت لودینگ
  if (loading) {
    return (
      <PageLoader className="min-h-[60vh]" label="در حال بارگذاری جزئیات دسته‌بندی..." />
    );
  }

  const missing = [!name.trim() && "نام", !slug.trim() && "اسلاگ"].filter(Boolean);
  const status = missing.length ? `هنوز لازم است: ${missing.join("، ")}` : hasChanged ? "تغییرات ذخیره‌نشده دارید" : "تغییری اعمال نشده است";

  return (
    <>
      <PageHeader
        icon={<SquarePen className="h-[22px] w-[22px]" aria-hidden="true" />}
        title="ویرایش اطلاعات دسته‌بندی"
        subtitle={initialData.name ? <>در حال ویرایش «<b>{initialData.name}</b>»</> : undefined}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <FormSection index={0} icon={Shapes} title="اطلاعات دسته‌بندی" hint="نام در منوی فروشگاه و آدرس صفحه در لینک‌ها دیده می‌شود">
            <div className="grid gap-4">
              <TextInput label="نام دسته‌بندی" required placeholder="مثال: چرخ خیاطی" value={name} onChange={(e) => setName(e.target.value)} />
              <TextInput
                label="اسلاگ دسته‌بندی"
                required
                ltr
                placeholder="sewing-machine"
                hint={slug.trim() ? <>آدرس صفحه: <bdi dir="ltr">/categories/{slug.trim()}</bdi></> : "بخش انگلیسی آدرس صفحه؛ بدون فاصله"}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </FormSection>

          <FormSection index={1} icon={ImageIcon} title="تصویر دسته‌بندی" hint="اختیاری؛ پیش‌نمایش با تایپ نام فایل به‌روز می‌شود" className="lg:sticky lg:top-0">
            <ImagePreviewField
              kind="category"
              preview={img}
              label="آدرس تصویر"
              placeholder="مثال: y.png"
              hint="نام فایلی که داخل پوشهٔ public/image گذاشته‌اید، یا آدرس کامل (اختیاری)"
              emptyText="پیش‌نمایش تصویر دسته‌بندی"
            />
          </FormSection>
        </div>

        <SaveBar label="ذخیرهٔ تغییرات" backHref="/admin/categories" saving={isSaving} disabled={!hasChanged} tone={missing.length || hasChanged ? "dirty" : "idle"} status={status} />
      </form>
    </>
  );
}
