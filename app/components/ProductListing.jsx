"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, BadgePercent, Banknote, BookOpen, Boxes, Check, FunnelPlus, ChevronDown, ChevronLeft, ChevronRight, FunnelX, LayoutGrid, Package, PackageCheck, SlidersHorizontal, X, PackageSearch  } from "lucide-react";
import CategoryIcon from "@/app/components/CategoryIcon";
import ProductCard from "@/app/components/ProductCard";
import { SORTS, activeFilterCount, buildListUrl, pageItems, parsePrice } from "@/lib/productQuery";

const fa = (n) => Number(n).toLocaleString("fa-IR");

const FIELD =
  "w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2";
const BUTTON =
  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";
// همهٔ حرکت‌های باز و بسته‌شدن (chevron، پنل فیلتر، منوی مرتب‌سازی) یک منحنی و یک مدت دارند تا یکدست و نرم باشند
const SOFT = "duration-300 ease-out motion-reduce:transition-none";

// کاشی روشن/خاموش‌شدنی (چک‌باکس واقعی با ظاهر کاشی): input با sr-only فوکوس و صفحه‌کلید را نگه می‌دارد و کاشی با peer/has حالتش را نشان می‌دهد
function ToggleTile({ icon: Icon, checked, onChange, children }) {
  return (
    <label className="group relative block cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="flex min-h-14 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 transition duration-200 hover:border-brand-200 hover:bg-brand-50/50 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 group-has-[:checked]:border-brand-500 group-has-[:checked]:bg-brand-50 group-has-[:checked]:text-brand-700">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-500 transition duration-200 group-has-[:checked]:bg-brand-600 group-has-[:checked]:text-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="flex-1 leading-6">{children}</span>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-gray-300 text-transparent transition duration-200 group-has-[:checked]:border-brand-600 group-has-[:checked]:bg-brand-600 group-has-[:checked]:text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
        </span>
      </span>
    </label>
  );
}

// پنل فیلترها؛ با هر تغییر آدرس (key) از نو ساخته می‌شود تا ورودی‌ها همان مقدار اعمال‌شده را نشان بدهند
function FilterPanel({ params, bounds, onApply, clearHref }) {
  // مقدار اعمال‌شده همان‌طور که در چیپ فعال دیده می‌شود (رقم فارسی و جداکنندهٔ هزارگان) در فیلد می‌آید؛ parsePrice هر دو شکل را می‌خواند
  const [min, setMin] = useState(params.min != null ? fa(params.min) : "");
  const [max, setMax] = useState(params.max != null ? fa(params.max) : "");
  const [invalid, setInvalid] = useState(false);
  const [text, setText] = useState(params.q);

  // مقدار خالی یعنی بدون حد؛ متنی که عدد نیست اعمال نمی‌شود و خطا نشان می‌دهد
  const lo = min.trim() === "" ? null : parsePrice(min);
  const hi = max.trim() === "" ? null : parsePrice(max);
  const badPrice = (min.trim() !== "" && lo == null) || (max.trim() !== "" && hi == null);
  const apply = (extra = {}) => {
    if (badPrice) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onApply({ q: text.trim(), min: lo, max: hi, ...extra });
  };

  // «اعمال فیلتر» فقط وقتی کار دارد که فرم با فیلتر اعمال‌شدهٔ آدرس فرق کند (چیزی نوشته یا پاک شده)؛ «پاک‌کردن» فقط وقتی فیلتری واقعاً اعمال شده.
  // متن قیمت نامعتبر هم تغییر حساب می‌شود تا دکمه فعال بماند و خطا را نشان بدهد. کاشی‌های «موجود/تخفیف‌دار» همان لحظه اعمال می‌شوند و جزو این حساب نیستند.
  const dirty = text.trim() !== params.q || badPrice || lo !== (params.min ?? null) || hi !== (params.max ?? null);
  const appliedCount = activeFilterCount(params);
  const hasApplied = appliedCount > 0;
  // برچسب دکمه‌ها با شمار فیلترها مفرد/جمع می‌شود: «اعمال» شمار انتخاب‌های فرم (متن، قیمت و کاشی‌ها) را می‌شمارد و «پاک کردن» شمار فیلترهای اعمال‌شده را
  const selectedCount = (text.trim() !== "" ? 1 : 0) + (min.trim() !== "" || max.trim() !== "" ? 1 : 0) + (params.available ? 1 : 0) + (params.discount ? 1 : 0);
  const applyLabel = selectedCount > 1 ? "اعمال فیلترها" : "اعمال فیلتر";
  const clearLabel = appliedCount > 1 ? "پاک کردن فیلترها" : "پاک کردن فیلتر";

  // «از» و «تومان» داخل خود فیلت‌اند؛ پدینگ‌های ps/pe جا برایشان نگه می‌دارند و متن عدد زیرشان نمی‌رود
  const priceField = (value, setValue, label, prefix, placeholder) => {
    const bad = invalid && value.trim() !== "" && parsePrice(value) == null;
    return (
      <label className="relative block min-w-0 flex-1">
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-xs text-gray-400">{prefix}</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={label}
          aria-invalid={bad}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${FIELD} min-h-11 ps-9 pe-14 ${bad ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:border-brand-500 focus:ring-brand-200"}`}
        />
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-gray-400">تومان</span>
      </label>
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (dirty) apply();
      }}
      className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/60 p-4 shadow-sm sm:p-5"
    >
      {/* جستجوی نام برند یا محصول: لینک‌های نوار برندهای صفحهٔ اصلی همین فیلتر را با نام برند پر می‌کنند */}
      <div className="mb-4 rounded-xl bg-white/80 p-4 ring-1 ring-gray-200">
        <label htmlFor="product-search" className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <PackageSearch className="h-5 w-5" aria-hidden="true" />
          </span>
          نام برند یا نام محصول
        </label>
        <div className="relative">
          <input
            id="product-search"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={60}
            placeholder="مثلاً ژانومه یا ژانومه ۶۲۵"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`${FIELD} min-h-11 border-gray-300 pe-10 focus:border-brand-500 focus:ring-brand-200`}
          />
          {text !== "" && (
            <button
              type="button"
              onClick={() => setText("")}
              aria-label="پاک‌کردن جستجو"
              className="btn-flat absolute inset-y-0 end-1 grid w-9 cursor-pointer place-items-center rounded-lg text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]">
        <fieldset className="rounded-xl bg-white/80 p-4 ring-1 ring-gray-200">
          <legend className="sr-only">محدودهٔ قیمت</legend>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800" aria-hidden="true">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Banknote className="h-5 w-5" />
            </span>
            محدودهٔ قیمت
          </div>
          {/* روی صفحهٔ باریک فیلدها زیر هم می‌نشینند: کنار هم هر کدام آن‌قدر کوچک می‌شد که عدد زیر «از» و «تومان» بریده می‌شد */}
          <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center">
            {priceField(min, setMin, "حداقل قیمت", "از", fa(bounds.min))}
            <span aria-hidden="true" className="hidden h-px w-3 shrink-0 bg-gray-300 min-[480px]:block" />
            {priceField(max, setMax, "حداکثر قیمت", "تا", fa(bounds.max))}
          </div>
          {invalid ? (
            <p className="mt-2 text-xs text-red-600">قیمت را فقط با رقم وارد کنید.</p>
          ) : (
            <p className="mt-2 text-xs text-gray-400">
              قیمت کالاها از {fa(bounds.min)} تا {fa(bounds.max)} تومان است.
            </p>
          )}
        </fieldset>

        <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <ToggleTile icon={PackageCheck} checked={params.available} onChange={(e) => apply({ available: e.target.checked })}>
            فقط کالاهای موجود
          </ToggleTile>
          <ToggleTile icon={BadgePercent} checked={params.discount} onChange={(e) => apply({ discount: e.target.checked })}>
            فقط کالاهای تخفیف‌دار
          </ToggleTile>
        </div>

        {/* دکمه‌ها کوچک و هم‌اندازه‌اند: روی دسکتاپ flex-1 نباید باشد، وگرنه به‌اندازهٔ ارتفاع ردیف کش می‌آمدند */}
        <div className="flex gap-2 lg:w-36 lg:flex-col lg:justify-center">
          <button
            type="submit"
            disabled={!dirty}
            title={dirty ? undefined : "تغییری برای اعمال وجود ندارد"}
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white shadow-sm transition enabled:hover:bg-brand-700 enabled:active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none lg:flex-none"
          >
            <FunnelPlus className="h-4 w-4" aria-hidden="true" />
            {applyLabel}
          </button>
          {hasApplied ? (
            <Link
              href={clearHref}
              scroll={false}
              className="btn-3d inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-700 bg-red-600 px-3 text-sm font-medium text-white shadow-sm transition hover:border-red-800 hover:bg-red-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 lg:flex-none"
            >
              <FunnelX className="h-4 w-4" aria-hidden="true" />
              {clearLabel}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title="هیچ فیلتری اعمال نشده است"
              className="inline-flex h-10 flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm font-medium text-gray-400 lg:flex-none"
            >
              <FunnelX className="h-4 w-4" aria-hidden="true" />
              {clearLabel}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

// منوی مرتب‌سازی: select بومی نمی‌گوید کی باز است، پس chevron نمی‌توانست نرم بچرخد؛ این یک listbox ساده با همان رفتار صفحه‌کلید است
function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const button = useRef(null);
  const list = useRef(null);
  const selected = Math.max(0, SORTS.findIndex((sort) => sort.value === value));

  // فوکوس هنگام باز شدن به فهرست می‌رود تا کلیدهای جهت‌دار کار کنند
  useEffect(() => {
    if (open) list.current?.focus({ preventScroll: true });
  }, [open]);

  const openMenu = () => {
    setActive(selected);
    setOpen(true);
  };
  const close = (refocus = false) => {
    setOpen(false);
    // preventScroll: اگر دکمه از دید بیرون رفته باشد، برگرداندن فوکوس صفحه را نپراند
    if (refocus) button.current?.focus({ preventScroll: true });
  };
  const choose = (index) => {
    close(true);
    if (SORTS[index].value !== value) onChange(SORTS[index].value);
  };

  const onListKey = (e) => {
    const last = SORTS.length - 1;
    if (e.key === "ArrowDown") setActive((i) => Math.min(last, i + 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") choose(active);
    else if (e.key === "Escape") close(true);
    else if (e.key === "Tab") return close();
    else return;
    e.preventDefault();
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-gray-600">
        <ArrowUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <span className="hidden sm:inline">مرتب‌سازی:</span>
      </span>

      {/* فوکوس که از کل این بخش بیرون رفت (کلیک بیرون یا Tab) منو را می‌بندد */}
      <div
        ref={root}
        className="relative min-w-0 flex-1 sm:flex-none"
        onBlur={(e) => {
          if (!root.current?.contains(e.relatedTarget)) setOpen(false);
        }}
      >
        <button
          ref={button}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="sort-listbox"
          aria-label={`مرتب‌سازی: ${SORTS[selected].label}`}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              if (!open) openMenu();
            }
          }}
          className="flex min-h-10 w-full min-w-[9.5rem] cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-300 bg-white py-2 pl-3.5 pr-3 text-sm text-gray-800 transition hover:border-brand-200 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        >
          <span className="truncate">{SORTS[selected].label}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${SOFT} ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        <ul
          ref={list}
          id="sort-listbox"
          role="listbox"
          tabIndex={-1}
          aria-label="مرتب‌سازی"
          aria-activedescendant={open ? `sort-option-${active}` : undefined}
          onKeyDown={onListKey}
          onMouseDown={(e) => e.preventDefault()}
          // بسته: inert (نه visibility) تا از فوکوس، خواننده‌ها و موس پنهان باشد ولی لحظهٔ باز شدن فوراً فوکوس‌پذیر شود
          inert={!open}
          className={`absolute left-0 top-full z-30 mt-2 min-w-full origin-top-left rounded-xl border border-gray-200 bg-white p-1 shadow-lg outline-none transition-[opacity,transform] ${SOFT} ${
            open ? "translate-y-0 scale-100 opacity-100" : "-translate-y-1 scale-95 opacity-0"
          }`}
        >
          {SORTS.map((sort, index) => (
            <li
              key={sort.value}
              id={`sort-option-${index}`}
              role="option"
              aria-selected={index === selected}
              onClick={() => choose(index)}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center justify-between gap-6 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                index === active ? "bg-brand-50 text-brand-700" : "text-gray-700"
              } ${index === selected ? "font-medium" : ""}`}
            >
              {sort.label}
              {index === selected && <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Pagination({ basePath, params, page, pageCount }) {
  if (pageCount <= 1) return null;
  const href = (n) => buildListUrl(basePath, params, { page: n });
  const arrow = "btn-3d grid h-10 w-10 place-items-center rounded-xl border transition";
  const enabled = `${arrow} border-gray-300 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700`;
  // در اولین و آخرین صفحه دکمهٔ غیرفعال است (نه فقط کمرنگ): خوانندهٔ صفحه آن را «غیرفعال» می‌خواند و نشانگر موس not-allowed می‌شود
  const disabled = `${arrow} cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300`;
  return (
    <nav aria-label="صفحه‌بندی" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" aria-label="صفحهٔ قبل" className={enabled}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      ) : (
        <button type="button" disabled aria-label="صفحهٔ قبل" title="این اولین صفحه است" className={disabled}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {pageItems(page, pageCount).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-gray-400">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className="grid h-10 min-w-10 place-items-center rounded-xl bg-brand-600 px-2 text-sm font-bold text-white">
            {fa(item)}
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            aria-label={`صفحهٔ ${fa(item)}`}
            className="btn-3d grid h-10 min-w-10 place-items-center rounded-xl border border-gray-300 bg-white px-2 text-sm text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            {fa(item)}
          </Link>
        )
      )}

      {page < pageCount ? (
        <Link href={href(page + 1)} rel="next" aria-label="صفحهٔ بعد" className={enabled}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      ) : (
        <button type="button" disabled aria-label="صفحهٔ بعد" title="این آخرین صفحه است" className={disabled}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </nav>
  );
}

// فهرست محصولات با دسته‌ها، مرتب‌سازی، فیلتر و صفحه‌بندی؛ داده و پارامترها را صفحهٔ سروری می‌دهد (app/products و app/categories)
// و وضعیت فقط در آدرس است: هر تغییر آدرس را عوض می‌کند، سرور صفحهٔ تازه را می‌سازد و دکمهٔ «برگشت» مرورگر کار می‌کند.
// category: دستهٔ همین صفحه (برای آیکون عنوان)؛ در «همه محصولات» خالی است.
export default function ProductListing({ title, accent, category, basePath, categories, params, result, emptyMessage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const filterCount = activeFilterCount(params);
  const [panelOpen, setPanelOpen] = useState(filterCount > 0);

  const go = (overrides) =>
    startTransition(() => {
      router.push(buildListUrl(basePath, params, { page: 1, ...overrides }), { scroll: false });
    });
  const clearFilters = { q: "", min: null, max: null, available: false, discount: false, page: 1 };
  const clearHref = buildListUrl(basePath, params, clearFilters);

  const { items, total, scopeTotal, page, pageCount, bounds } = result;
  const countText = filterCount > 0 ? `${fa(total)} محصول از ${fa(scopeTotal)}` : `${fa(total)} محصول`;

  const chipBase =
    "chip-3d inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";
  const chipOn = "border-brand-600 bg-brand-600 font-medium text-white";
  const chipOff = "border-gray-300 bg-white text-gray-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            {category ? <CategoryIcon slug={category.slug} name={category.name} className="h-6 w-6" /> : <Boxes className="h-6 w-6" aria-hidden="true" />}
          </span>
          <span>
            {title}
            {accent && <span className="text-brand-600">{accent}</span>}
          </span>
        </h1>
        {scopeTotal > 0 && (
          <div aria-live="polite" className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700 ring-1 ring-brand-100">
              <Package className="h-4 w-4" aria-hidden="true" />
              {countText}
            </span>
            {pageCount > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-600">
                <BookOpen className="h-4 w-4 text-gray-400" aria-hidden="true" />
                صفحهٔ {fa(page)} از {fa(pageCount)}
              </span>
            )}
          </div>
        )}
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {categories.length > 0 ? (
          // پدینگ بالا و پایین جای بالا آمدن و سایهٔ چیپ‌ها را می‌دهد؛ مارجین منفی همان‌قدر آن را جبران می‌کند تا فاصله‌ها عوض نشود
          <nav
            aria-label="دسته‌بندی‌ها"
            className="no-scrollbar -mx-4 -mb-5 -mt-3 flex min-w-0 gap-2 overflow-x-auto px-4 pb-5 pt-3 sm:mx-0 sm:mb-0 sm:mt-0 sm:flex-wrap sm:overflow-visible sm:p-0"
          >
            <Link
              href={buildListUrl("/products", params, { page: 1 })}
              aria-current={basePath === "/products" ? "page" : undefined}
              className={`${chipBase} ${basePath === "/products" ? chipOn : chipOff}`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              همه
            </Link>
            {categories.map((cat) => {
              const path = `/categories/${encodeURIComponent(cat.slug)}`;
              const active = basePath === path;
              return (
                <Link
                  key={cat.id}
                  href={buildListUrl(path, params, { page: 1 })}
                  aria-current={active ? "page" : undefined}
                  className={`${chipBase} ${active ? chipOn : chipOff}`}
                >
                  <CategoryIcon slug={cat.slug} name={cat.name} className="h-4 w-4" />
                  {cat.name}
                  <span className={`rounded-full px-2 py-0.5 text-xs leading-none transition-colors ${active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {fa(cat.count)}
                  </span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <span />
        )}

        {scopeTotal > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPanelOpen((open) => !open)}
              aria-expanded={panelOpen}
              aria-controls="product-filters"
              className={BUTTON}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              فیلترها
              {filterCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">{fa(filterCount)}</span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${SOFT} ${panelOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>

            <SortMenu value={params.sort} onChange={(sort) => go({ sort })} />
          </div>
        )}
      </div>

      {scopeTotal > 0 && (
        <>
          {/* پنل همیشه در صفحه است و با تغییر ارتفاع از صفر (grid-rows 0fr -> 1fr) و محو شدن باز و بسته می‌شود؛ بسته: inert، یعنی کلیدها و خواننده‌ها از آن رد می‌شوند */}
          <div
            id="product-filters"
            aria-hidden={!panelOpen}
            inert={!panelOpen}
            className={`grid transition-[grid-template-rows,opacity,margin,transform] ${SOFT} ${
              panelOpen ? "mb-4 translate-y-0 grid-rows-[1fr] opacity-100" : "-translate-y-1 grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <FilterPanel
                key={`${params.q}|${params.min}|${params.max}|${params.available}|${params.discount}`}
                params={params}
                bounds={bounds}
                onApply={go}
                clearHref={clearHref}
              />
            </div>
          </div>

        </>
      )}

      {scopeTotal === 0 ? (
        <p className="mt-10 text-center text-gray-500">{emptyMessage}</p>
      ) : total === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-gray-600">هیچ محصولی با این فیلترها پیدا نشد.</p>
          <Link href={clearHref} scroll={false} className="btn-3d mt-4 inline-block rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700">
            پاک‌کردن فیلترها
          </Link>
        </div>
      ) : (
        <div
          aria-busy={pending}
          className={`grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${pending ? "opacity-60" : ""}`}
        >
          {items.map((product, index) => (
            <div key={product.id} className="product-in h-full" style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}>
              <ProductCard product={product} priority={index < 4} />
            </div>
          ))}
        </div>
      )}

      <Pagination basePath={basePath} params={params} page={page} pageCount={pageCount} />
    </div>
  );
}
