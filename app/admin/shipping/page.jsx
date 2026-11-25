"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp, Gift, History, ListOrdered, Truck } from "lucide-react";
import { TrashCan } from "@/app/components/ActionIcons";
import PageHeader from "@/app/admin/_shell/PageHeader";
import FormSection from "@/app/admin/_form/FormSection";
import { TextInput } from "@/app/admin/_form/Fields";
import SaveBar from "@/app/admin/_form/SaveBar";
import useFlip from "@/app/admin/_ui/useFlip";
import { prefersReducedMotion, scrollBehavior, useChangeKey } from "@/lib/motion";
import { tip } from "@/lib/tip";
import { MAX_COST, MAX_METHODS } from "@/lib/shipping";
import ShippingPreview from "./ShippingPreview";
import Icon from '@mdi/react';
import { mdiTruckPlusOutline } from '@mdi/js';
import "./switch.css";
import "./shipping.css";

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

// کلید فعال/غیرفعال بودن یک روش (role=switch با صفحه‌کلید و صفحه‌خوان). عنوان وضعیت («فعال» یا «غیرفعال») داخل خود کلید است و ظاهر و حرکتش در switch.css (پیشوند shs-) می‌آید:
// ۸۸×۳۲px با دستگیرهٔ ۲۴px و نوشتهٔ ۱۲px؛ فعال سبز و غیرفعال خاکستری. ظاهر را چند کلاس CSS ساده می‌سازد، نه ده‌ها کلاس Tailwind که
// یک بار جابه‌جایی دستگیره‌اش اعمال نشد و دستگیره روی نوشته ماند
function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="shs">
      <span aria-hidden="true" className="shs-knob" />
      <span aria-hidden="true" className="shs-txt shs-on">
        فعال
      </span>
      <span aria-hidden="true" className="shs-txt shs-off">
        غیرفعال
      </span>
    </button>
  );
}

// چیپ هزینهٔ سربرگ هر کارت: مبلغ (برند) یا «رایگان» (سبز)، و برای روش غیرفعال خاکستری. رنگ نرم عوض می‌شود و مبلغ هنگام تغییر جهش کوچکی می‌کند (نه هنگام نمایش اولیه)
function CostChip({ cost, active }) {
  const free = cost === 0;
  const popKey = useChangeKey(free ? "free" : cost);
  const tone = !active ? "bg-gray-100 text-gray-500 ring-gray-200" : free ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-brand-50 text-brand-700 ring-brand-200";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold leading-none ring-1 ring-inset transition-colors duration-500 ${tone}`}>
      {free && <Gift className="h-3.5 w-3.5" aria-hidden="true" />}
      <span key={popKey} className={`tabular-nums ${popKey ? "shp-pop" : ""}`}>
        {free ? "رایگان" : `${fa(cost)} تومان`}
      </span>
    </span>
  );
}

// چیپ‌های زیر عنوان کارت اصلی: قانون هزینهٔ صفر، گنجایش (۸ تکهٔ پرشونده)، شمار روش‌های فعال و اثرنداشتن بر سفارش‌های قبلی. عددها از همین فهرست حساب می‌شوند.
// نقطهٔ «روش فعال» مثل نقطهٔ وضعیت نوار ذخیره می‌تپد و هالهٔ نرم می‌دهد (beat-dot در globals.css): سبز با روش فعال، کهربایی وقتی همه غیرفعال‌اند و بی‌تپش و خاکستری بدون هیچ روش
const CHIP = "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-50 px-2.5 text-[11.5px] font-medium leading-none text-gray-600 ring-1 ring-inset ring-gray-200";
function HintChips({ loading, total, active }) {
  const dot = total === 0 ? "bg-gray-300" : active === 0 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className={CHIP}>
        <Gift className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        هزینهٔ ۰ = ارسال رایگان
      </span>
      {!loading && (
        <>
          <span className={CHIP}>
            <ListOrdered className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
            {fa(total)} از {fa(MAX_METHODS)} روش
            <span aria-hidden="true" className="flex gap-0.5">
              {Array.from({ length: MAX_METHODS }, (_, i) => (
                <i key={i} className={`h-1.5 w-2 rounded-full transition-colors duration-300 ${i < total ? "bg-brand-500" : "bg-gray-300"}`} />
              ))}
            </span>
          </span>
          <span className={CHIP}>
            <span aria-hidden="true" className={`h-2 w-2 rounded-full transition-colors duration-300 ${dot} ${total === 0 ? "" : "beat-dot"}`} />
            {fa(active)} روش فعال
          </span>
        </>
      )}
      <span className={CHIP}>
        <History className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
        بدون اثر بر سفارش‌های قبلی
      </span>
    </span>
  );
}

const ARROW = "grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-30";

export default function AdminShipping() {
  const router = useRouter();
  const [rows, setRows] = useState(null); // null = در حال دریافت
  const [saved, setSaved] = useState("[]"); // آخرین مقدار ذخیره‌شده (برای تشخیص تغییر)
  const [saving, setSaving] = useState(false);
  const [freshId, setFreshId] = useState(null); // روشی که همین الان افزوده شده (انیمیشن ورود)
  const [leaving, setLeaving] = useState(() => new Set()); // روش‌هایی که در حال جمع شدن‌اند و کمی بعد حذف می‌شوند
  const listRef = useRef(null);
  const focusNew = useRef(null); // شناسهٔ روش تازه‌ای که بعد از افزودن باید فوکوس بگیرد
  const refocus = useRef(null); // «شناسه:جهت» دکمهٔ جابه‌جایی که بعد از جابه‌جا شدن باید فوکوس را نگه دارد
  useFlip(listRef);
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

  // حذف: کارت اول با گذار جمع می‌شود و بعد از ردیف‌ها برداشته می‌شود (با «کاهش حرکت» فوری)
  const remove = (id) => {
    if (leaving.has(id)) return;
    const drop = () => {
      setRows((list) => list.filter((r) => r.id !== id));
      setLeaving((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    };
    if (prefersReducedMotion()) return drop();
    setLeaving((s) => new Set(s).add(id));
    setTimeout(drop, 340);
  };

  // افزودن: کارت تازه با باز شدن ارتفاع می‌آید و بعد نام آن فوکوس می‌گیرد
  const add = () => {
    const row = blank();
    setRows((list) => [...list, row]);
    setFreshId(row.id);
    focusNew.current = row.id;
  };

  // ترتیب فهرست همان ترتیب نمایش در سبد است و اولین روش فعال از ابتدا انتخاب می‌شود؛ جابه‌جایی دو ردیف همسایه
  const move = (id, dir) => {
    setRows((list) => {
      const i = list.findIndex((r) => r.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    refocus.current = `${id}:${dir}`;
  };

  // بعد از هر تغییر ردیف‌ها: فوکوس نام روش تازه، یا برگرداندن فوکوس به دکمهٔ جابه‌جایی (جابه‌جایی گره DOM را عوض می‌کند و فوکوس می‌پرد؛ اگر دکمه به سر فهرست رسید و غیرفعال شد، دکمهٔ مقابل)
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const newId = focusNew.current;
    if (newId) {
      focusNew.current = null;
      const row = [...root.children].find((el) => el.dataset.flip === newId);
      setTimeout(() => row?.querySelector("input")?.focus({ preventScroll: true }), 160);
      setTimeout(() => row?.scrollIntoView({ block: "nearest", behavior: scrollBehavior() }), 480);
    }
    const want = refocus.current;
    if (want) {
      refocus.current = null;
      const id = want.slice(0, want.lastIndexOf(":"));
      const buttons = [...root.querySelectorAll("[data-move]")].filter((b) => !b.disabled);
      const target = buttons.find((b) => b.dataset.move === want) || buttons.find((b) => b.dataset.move.startsWith(`${id}:`));
      target?.focus({ preventScroll: true });
      target?.closest("[data-flip]")?.scrollIntoView({ block: "nearest", behavior: scrollBehavior() });
    }
  }, [rows]);

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

  // دکمهٔ افزودن در سر کارت اصلی است (سر کارت با اسکرول فهرست سر جایش می‌ماند)، پس بدون اسکرول کردن تا ته فهرست همیشه در دسترس است. روش تازه به انتهای فهرست اضافه می‌شود و صفحه تا آن می‌لغزد.
  // در سقف ۸ روش غیرفعال می‌شود و دلیلش را راهنما می‌گوید (راهنما روی span است، چون دکمهٔ غیرفعال رویداد موس نمی‌گیرد)؛ تا رسیدن فهرست جایش را یک اسکلتون هم‌اندازه می‌گیرد
  const full = rows !== null && rows.length >= MAX_METHODS;
  const addAction =
    rows === null ? (
      <span className="block h-10 w-40 animate-pulse rounded-xl bg-gray-200" aria-hidden="true" />
    ) : (
      <span {...tip(full ? `به سقف ${fa(MAX_METHODS)} روش رسیده‌اید` : undefined)} className="inline-flex">
        <button
          type="button"
          onClick={add}
          disabled={full}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none"
        >
          <Icon path={mdiTruckPlusOutline} size={1} className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
          افزودن روش ارسال
        </button>
      </span>
    );

  return (
    <>
      <PageHeader icon={<Truck className="h-[22px] w-[22px]" aria-hidden="true" />} title="روش‌های ارسال" subtitle="روش‌ها و هزینه‌ای که مشتری هنگام پرداخت می‌بیند و انتخاب می‌کند." />

      {/* از md به بالا فرم هم‌ارتفاع ناحیهٔ محتوای main است (100cqh، مثل TablePage): سربرگ صفحه و سرِ کارت (عنوان و چیپ‌های زیرش) و نوار ذخیره سر جایشان می‌مانند و فقط بدنهٔ کارت
          اسکرول می‌خورد. کف ۲۴rem: در پنجرهٔ کوتاه‌تر خود main اسکرول می‌خورد. زیر md ارتفاع آزاد است و صفحه مثل قبل اسکرول می‌خورد.
          بدنه در عرض کافی (container query ناحیهٔ محتوا، ۵۶rem) دو ستونه است: فهرست روش‌ها و پیش‌نمایش چسبانِ سبد خرید؛ در عرض کم پیش‌نمایش زیر فهرست می‌آید */}
      <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col md:h-[100cqh] md:min-h-[24rem]">
        <FormSection index={0} scroll icon={Truck} title="روش‌ها و هزینه‌ها" hint={<HintChips loading={rows === null} total={(rows || []).length} active={activeCount} />} actions={addAction}>
          {rows === null ? (
            <div className="grid gap-3" aria-hidden="true">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 @4xl:grid-cols-[minmax(0,1fr)_21rem] @4xl:items-start">
              <div ref={listRef} className="relative min-w-0">
                {rows.length === 0 && (
                  <p data-flip="warn-none" className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800 ring-1 ring-amber-200">
                    هیچ روشی تعریف نشده است؛ مشتری هنگام پرداخت روش و هزینهٔ ارسالی نمی‌بیند و سفارش بدون هزینهٔ ارسال ثبت می‌شود.
                  </p>
                )}
                {rows.length > 0 && activeCount === 0 && (
                  <p data-flip="warn-off" className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800 ring-1 ring-amber-200">
                    همهٔ روش‌ها غیرفعال‌اند؛ مشتری روش و هزینهٔ ارسالی نمی‌بیند و سفارش بدون هزینهٔ ارسال ثبت می‌شود.
                  </p>
                )}
                {rows.map((r, i) => {
                  const cost = Number(r.cost || 0);
                  const name = r.label.trim();
                  const nick = name || `روش ${fa(i + 1)}`;
                  const isLeaving = leaving.has(r.id);
                  return (
                    <div
                      key={r.id}
                      data-flip={r.id}
                      data-fresh={r.id === freshId ? "" : undefined}
                      data-leaving={isLeaving ? "" : undefined}
                      inert={isLeaving}
                      className="shp-row"
                      onAnimationEnd={(e) => {
                        if (e.target === e.currentTarget && r.id === freshId) setFreshId(null);
                      }}
                    >
                      <div>
                        <div className="pb-3 pt-px">
                          <div className="shp-card p-4 ps-5" data-off={r.active ? undefined : ""}>
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                              <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-brand-50 px-2 text-sm font-extrabold tabular-nums text-brand-700">{fa(i + 1)}</span>
                              <div className="flex min-w-0 flex-1 basis-40 items-center gap-2">
                                <h3 className={`min-w-0 truncate text-[15px] leading-7 transition-colors duration-300 ${name ? `font-bold ${r.active ? "text-gray-900" : "text-gray-500"}` : "font-medium text-gray-400"}`}>{name || "روش بدون نام"}</h3>
                                <CostChip cost={cost} active={r.active} />
                              </div>
                              <div className="ms-auto flex items-center gap-1.5">
                                <button type="button" data-move={`${r.id}:-1`} onClick={() => move(r.id, -1)} disabled={i === 0} aria-label={`بالا بردن «${nick}»`} {...tip(i > 0 ? "بالا بردن" : undefined)} className={ARROW}>
                                  <ChevronUp className="h-[18px] w-[18px]" aria-hidden="true" />
                                </button>
                                <button type="button" data-move={`${r.id}:1`} onClick={() => move(r.id, 1)} disabled={i === rows.length - 1} aria-label={`پایین بردن «${nick}»`} {...tip(i < rows.length - 1 ? "پایین بردن" : undefined)} className={ARROW}>
                                  <ChevronDown className="h-[18px] w-[18px]" aria-hidden="true" />
                                </button>
                                <Switch checked={r.active} onChange={(v) => patch(r.id, { active: v })} label={`فعال بودن «${nick}»`} />
                                <button
                                  type="button"
                                  onClick={() => remove(r.id)}
                                  aria-label={`حذف «${nick}»`}
                                  {...tip(`حذف روش «${name || `شمارهٔ ${fa(i + 1)}`}»`)}
                                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                                >
                                  <TrashCan />
                                </button>
                              </div>
                            </div>
                            <div className="shp-body mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
                              <TextInput label="نام روش" required placeholder="مثال: پست پیشتاز" maxLength={40} value={r.label} error={problems[i] && !name ? problems[i] : undefined} onChange={(e) => patch(r.id, { label: e.target.value })} />
                              <TextInput
                                label="هزینه"
                                ltr
                                suffix="تومان"
                                inputMode="numeric"
                                placeholder="0"
                                value={r.cost}
                                error={cost > MAX_COST ? problems[i] : undefined}
                                onChange={(e) => patch(r.id, { cost: digitsOnly(e.target.value) })}
                              />
                              <TextInput className="sm:col-span-2" label="توضیح کوتاه (اختیاری)" placeholder="مثال: تحویل در ۳ تا ۷ روز کاری" maxLength={90} value={r.description} onChange={(e) => patch(r.id, { description: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <ShippingPreview rows={rows.filter((r) => !leaving.has(r.id))} className="@4xl:sticky @4xl:top-5" />
            </div>
          )}
        </FormSection>

        <SaveBar label="ذخیرهٔ روش‌های ارسال" backHref="/admin" saving={saving} disabled={rows === null || !dirty || invalid} tone={invalid || dirty ? "dirty" : "ready"} status={status} />
      </form>
    </>
  );
}
