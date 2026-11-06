"use client";

import PageLoader from "@/app/components/PageLoader";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ImageIcon, PanelTop, Type } from "lucide-react";
import PageHeader from "@/app/admin/_shell/PageHeader";
import FormSection from "@/app/admin/_form/FormSection";
import { TextInput } from "@/app/admin/_form/Fields";
import SaveBar from "@/app/admin/_form/SaveBar";
import ImagePreviewField from "@/app/admin/_form/ImagePreviewField";
import { useImagePreview } from "@/app/admin/_form/useImagePreview";

export default function EditBannerPage() {
  const router = useRouter();
  const { id } = useParams();

  const [title,   setTitle]   = useState("");
  const [desc,    setDesc]    = useState("");
  const preview = useImagePreview();
  const [loading,  setLoading]  = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState({ title: "", desc: "", img: "" });
  const { init: initImage } = preview;

  const img = preview.value;

  // 📦 دریافت اطلاعات بنر
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch(`/api/admin/banners/${id}`);
        if (!res.ok) throw new Error("بنر پیدا نشد");
        const data = await res.json();
        setTitle(data.title || "");
        setDesc(data.desc   || "");
        initImage(data.img  || "");
        setInitialData({ title: data.title || "", desc: data.desc || "", img: data.img || "" });
      } catch {
        toast.error("خطا در دریافت اطلاعات بنر");
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, [id, initImage]);

  const hasChanged =
    title !== initialData.title ||
    desc  !== initialData.desc  ||
    img   !== initialData.img;

  // 💾 ذخیره تغییرات
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ title, desc, img }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "خطا در ویرایش بنر");
      }
      toast.success("بنر با موفقیت ویرایش شد");
      router.push("/admin/banners");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ⏳ حالت لودینگ
  if (loading) {
    return (
      <PageLoader className="min-h-[60vh]" label="در حال بارگذاری جزئیات بنر..." />
    );
  }

  const status = hasChanged ? "تغییرات ذخیره‌نشده دارید" : "تغییری اعمال نشده است";

  return (
    <>
      <PageHeader
        icon={<PanelTop className="h-[22px] w-[22px]" aria-hidden="true" />}
        title="ویرایش اطلاعات بنر"
        subtitle={initialData.title ? <>در حال ویرایش «<b>{initialData.title}</b>»</> : undefined}
      />

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
              hint="نام فایلی که داخل پوشهٔ public/image گذاشته‌اید، یا آدرس کامل"
              emptyText="پیش‌نمایش تصویر بنر"
            />
          </FormSection>
        </div>

        <SaveBar label="ذخیرهٔ تغییرات" backHref="/admin/banners" saving={isSaving} disabled={!hasChanged} tone={hasChanged ? "dirty" : "idle"} status={status} />
      </form>
    </>
  );
}
