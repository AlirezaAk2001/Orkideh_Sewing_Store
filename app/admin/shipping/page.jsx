"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Trash2, Truck } from "lucide-react";
import PageHeader from "@/app/admin/_shell/PageHeader";
import FormSection from "@/app/admin/_form/FormSection";
import { TextInput } from "@/app/admin/_form/Fields";
import SaveBar from "@/app/admin/_form/SaveBar";
import { MAX_COST, MAX_METHODS } from "@/lib/shipping";

const fa = (n) => Number(n).toLocaleString("fa-IR");

// رقم‌های فارسی و عربی را لاتین می‌کند و جز رقم همه‌چیز را می‌اندازد (هزینه فقط عدد صحیح تومان است)
const digitsOnly = (v) =>
  String(v ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/\D/g, "")
    .slice(0, 9);

const blank = () => ({ id: `new-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, label: "", description: "", cost: "0", active: true });
const fromServer = (m) => ({ id: m.id, label: m.label, description: m.description || "", cost: String(m.cost), active: m.active !== false });
const toServer = (r) => ({ id: r.id, label: r.label.trim(), description: r.description.trim(), cost: Number(r.cost || 0), active: r.active });

// کلید ساده برای فعال/غیرفعال بودن یک روش (role=switch با صفحه‌کلید و صفحه‌خوان)
function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 ${checked ? "bg-brand-600" : "bg-gray-300"}`}
    >
      <span aria-hidden="true" className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "end-1" : "start-1"}`} />
    </button>
  );
}

export default function AdminShipping() {
  const router = useRouter();
  const [rows, setRows] = useState(null); // null = در حال دریافت
  const [saved, setSaved] = useState("[]"); // آخرین مقدار ذخیره‌شده (برای تشخیص تغییر)
  const [saving, setSaving] = useState(false);
  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("لطفاً ابتدا وارد شوید");
      router.push("/auth");
      return;
    }
    axios
      .get("/api/admin/shipping", { headers: headers() })
      .then((res) => {
        const list = (res.data.methods || []).map(fromServer);
        setRows(list);
        setSaved(JSON.stringify(list.map(toServer)));
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.response?.data?.error || "خطا در دریافت تنظیمات ارسال");
        setRows([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (id, change) => setRows((list) => list.map((r) => (r.id === id ? { ...r, ...change } : r)));
  const remove = (id) => setRows((list) => list.filter((r) => r.id !== id));
  const add = () => setRows((list) => [...list, blank()]);

  const dirty = useMemo(() => rows !== null && JSON.stringify(rows.map(toServer)) !== saved, [rows, saved]);
  const problems = useMemo(() => (rows || []).map((r) => (!r.label.trim() ? "نام روش الزامی است" : Number(r.cost || 0) > MAX_COST ? "هزینه بیش از حد مجاز است" : "")), [rows]);
  const invalid = problems.some(Boolean);
  const activeCount = (rows || []).filter((r) => r.active).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (invalid) return toast.error("نام همهٔ روش‌ها را وارد کنید");
    setSaving(true);
    try {
      const body = rows.map(toServer);
      const res = await axios.put("/api/admin/shipping", { methods: body }, { headers: headers() });
      const list = (res.data.methods || []).map(fromServer);
      setRows(list);
      setSaved(JSON.stringify(list.map(toServer)));
      toast.success("روش‌های ارسال ذخیره شد");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "خطا در ذخیرهٔ روش‌های ارسال");
    } finally {
      setSaving(false);
    }
  };

  const status = rows === null ? "در حال دریافت تنظیمات…" : invalid ? "نام هر روش الزامی است" : dirty ? "تغییرات ذخیره‌نشده دارید" : "همه‌چیز ذخیره است";

  return (
    <>
      <PageHeader icon={<Truck className="h-[22px] w-[22px]" aria-hidden="true" />} title="روش‌های ارسال" subtitle="روش‌ها و هزینه‌ای که مشتری هنگام پرداخت می‌بیند و انتخاب می‌کند." />

      <form onSubmit={handleSubmit}>
        <FormSection
          index={0}
          icon={Truck}
          title="روش‌ها و هزینه‌ها"
          hint={`هزینهٔ ۰ یعنی ارسال رایگان · حداکثر ${fa(MAX_METHODS)} روش · تغییرات روی سفارش‌های قبلی اثری ندارد`}
        >
          {rows === null ? (
            <div className="grid gap-3" aria-hidden="true">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {rows.length === 0 && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800 ring-1 ring-amber-200">
                  هیچ روشی تعریف نشده است؛ مشتری هنگام پرداخت روش و هزینهٔ ارسالی نمی‌بیند و سفارش بدون هزینهٔ ارسال ثبت می‌شود.
                </p>
              )}
              {rows.length > 0 && activeCount === 0 && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800 ring-1 ring-amber-200">
                  همهٔ روش‌ها غیرفعال‌اند؛ مشتری روش و هزینهٔ ارسالی نمی‌بیند و سفارش بدون هزینهٔ ارسال ثبت می‌شود.
                </p>
              )}
              {rows.map((r, i) => (
                <div key={r.id} className={`rounded-xl p-4 ring-1 transition ${r.active ? "bg-white ring-gray-200" : "bg-gray-50 ring-gray-200"}`}>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-brand-50 px-2 text-sm font-extrabold tabular-nums text-brand-700">{fa(i + 1)}</span>
                    <span className={`text-sm font-semibold ${r.active ? "text-emerald-700" : "text-gray-400"}`}>{r.active ? "فعال" : "غیرفعال"}</span>
                    <span className="ms-auto flex items-center gap-2">
                      <Switch checked={r.active} onChange={(v) => patch(r.id, { active: v })} label={`فعال بودن «${r.label || `روش ${fa(i + 1)}`}»`} />
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        aria-label={`حذف «${r.label || `روش ${fa(i + 1)}`}»`}
                        className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput label="نام روش" required placeholder="مثال: پست پیشتاز" maxLength={40} value={r.label} error={problems[i] && !r.label.trim() ? problems[i] : undefined} onChange={(e) => patch(r.id, { label: e.target.value })} />
                    <TextInput
                      label="هزینه"
                      ltr
                      suffix="تومان"
                      inputMode="numeric"
                      placeholder="0"
                      value={r.cost}
                      hint={Number(r.cost || 0) > 0 ? `${fa(Number(r.cost))} تومان` : "۰ = ارسال رایگان"}
                      error={Number(r.cost || 0) > MAX_COST ? problems[i] : undefined}
                      onChange={(e) => patch(r.id, { cost: digitsOnly(e.target.value) })}
                    />
                    <TextInput className="sm:col-span-2" label="توضیح کوتاه" placeholder="مثال: تحویل در ۳ تا ۷ روز کاری" maxLength={90} hint="اختیاری؛ زیر نام روش در سبد خرید دیده می‌شود" value={r.description} onChange={(e) => patch(r.id, { description: e.target.value })} />
                  </div>
                </div>
              ))}
              {rows.length < MAX_METHODS && (
                <button
                  type="button"
                  onClick={add}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white text-sm font-semibold text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                >
                  <Plus className="h-[18px] w-[18px]" aria-hidden="true" />
                  افزودن روش ارسال
                </button>
              )}
            </div>
          )}
        </FormSection>

        <SaveBar label="ذخیرهٔ روش‌های ارسال" backHref="/admin" saving={saving} disabled={rows === null || !dirty || invalid} tone={invalid || dirty ? "dirty" : "ready"} status={status} />
      </form>
    </>
  );
}
