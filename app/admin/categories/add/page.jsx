"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ImageIcon, Shapes, SquarePlus } from "lucide-react";
import PageHeader from "@/app/admin/_shell/PageHeader";
import FormSection from "@/app/admin/_form/FormSection";
import { TextInput } from "@/app/admin/_form/Fields";
import SaveBar from "@/app/admin/_form/SaveBar";
import ImagePreviewField from "@/app/admin/_form/ImagePreviewField";
import { useImagePreview } from "@/app/admin/_form/useImagePreview";

export default function AddCategory() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const img = useImagePreview();
  const [isSaving, setIsSaving] = useState(false);

  const image = img.value;
  const isFormFilled = name.trim() || slug.trim() || image.trim();

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    if (!name || !slug) {
      toast.error("نام و اسلاگ الزامی است");
      setIsSaving(false);
      return;
    }

    try {
      await axios.post(
        "/api/admin/categories",
        { name, slug, image },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("دسته‌بندی با موفقیت اضافه شد");
      router.push("/admin/categories");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "خطا در افزودن دسته‌بندی");
    } finally {
      setIsSaving(false);
    }
  };

  const missing = [!name.trim() && "نام", !slug.trim() && "اسلاگ"].filter(Boolean);
  const status = !isFormFilled ? "برای ذخیره، اطلاعات دسته‌بندی را وارد کنید" : missing.length ? `هنوز لازم است: ${missing.join("، ")}` : "همه‌چیز آمادهٔ ذخیره است";

  return (
    <>
      <PageHeader icon={<SquarePlus className="h-[22px] w-[22px]" aria-hidden="true" />} title="افزودن دسته‌بندی جدید" subtitle="نام، آدرس صفحه و تصویر دسته‌بندی را وارد کنید." />

      <form onSubmit={handleSubmit}>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <FormSection index={0} icon={Shapes} title="اطلاعات دسته‌بندی" hint="نام در منوی فروشگاه و آدرس صفحه در لینک‌ها دیده می‌شود">
            <div className="grid gap-4">
              <TextInput label="نام دسته‌بندی" placeholder="مثال: لامپ‌ها" value={name} onChange={(e) => setName(e.target.value)} />
              <TextInput
                label="اسلاگ دسته‌بندی"
                ltr
                placeholder="lamps"
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

        <SaveBar label="ذخیرهٔ دسته‌بندی" backHref="/admin/categories" saving={isSaving} disabled={!isFormFilled} tone={!isFormFilled ? "idle" : missing.length ? "dirty" : "ready"} status={status} />
      </form>
    </>
  );
}
