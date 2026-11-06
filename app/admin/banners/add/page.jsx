"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ImagePlus, ImageIcon, Type } from "lucide-react";
import PageHeader from "@/app/admin/_shell/PageHeader";
import FormSection from "@/app/admin/_form/FormSection";
import { TextInput } from "@/app/admin/_form/Fields";
import SaveBar from "@/app/admin/_form/SaveBar";
import ImagePreviewField from "@/app/admin/_form/ImagePreviewField";
import { useImagePreview } from "@/app/admin/_form/useImagePreview";

export default function AddBannerPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const preview = useImagePreview(); // مقدار فیلد بلادرنگ، آدرس پیش‌نمایش نیم ثانیه بعد از آخرین تایپ
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // آپلود تصویر در جریان است: ذخیره قفل می‌ماند

  const img = preview.value;
  const isFormFilled = title.trim() || desc.trim() || img.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ title, desc, img }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "خطا در ذخیره بنر");
      }
      toast.success("بنر با موفقیت اضافه شد");
      router.push("/admin/banners");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const missing = [!title.trim() && "عنوان", !desc.trim() && "توضیحات", !img.trim() && "تصویر"].filter(Boolean);
  const status = uploading ? "در حال آپلود تصویر؛ ذخیره بعد از پایان آپلود فعال می‌شود" : !isFormFilled ? "برای ذخیره، اطلاعات بنر را وارد کنید" : missing.length ? `هنوز لازم است: ${missing.join("، ")}` : "همه‌چیز آمادهٔ ذخیره است";

  return (
    <>
      <PageHeader icon={<ImagePlus className="h-[22px] w-[22px]" aria-hidden="true" />} title="افزودن بنر جدید" subtitle="متن و تصویر بنر را وارد کنید؛ نتیجه همان‌جا روی پیش‌نمایش دیده می‌شود." />

      <form onSubmit={handleSubmit}>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <FormSection index={0} icon={Type} title="متن بنر" hint="روی تصویر بنر در صفحهٔ اصلی نشان داده می‌شود">
            <div className="grid gap-4">
              <TextInput label="عنوان" placeholder="مثال: چرخ خیاطی ۱" value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextInput label="توضیحات" placeholder="مثال: هم‌اکنون با قیمت فوق‌العاده!" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
          </FormSection>

          <FormSection index={1} icon={ImageIcon} title="تصویر بنر" hint="پیش‌نمایش با همان نسبت اسلایدر صفحهٔ اصلی" className="lg:sticky lg:top-0">
            <ImagePreviewField
              kind="banner"
              preview={preview}
              overlay={{ title, desc }}
              label="آدرس تصویر"
              placeholder="مثال: x.png"
              hint="با آپلود خودکار پر می‌شود؛ یا نام فایلی از پوشهٔ public/image را بنویسید، یا آدرس کامل"
              onBusyChange={setUploading}
              disabled={isSaving}
            />
          </FormSection>
        </div>

        <SaveBar label="ذخیرهٔ بنر" backHref="/admin/banners" saving={isSaving} disabled={uploading || !isFormFilled} tone={uploading ? "dirty" : !isFormFilled ? "idle" : missing.length ? "dirty" : "ready"} status={status} />
      </form>
    </>
  );
}
