"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, List } from "lucide-react";
import ScrollThumb from "@/app/components/ScrollThumb";
import AppImage from "@/app/components/AppImage";
import "./select.css";

// فیلدهای فرم‌های پنل (جای TextField مواد) با همان برچسب شناورِ صفحه‌های ورود (.ff و .ff-label در globals.css): عنوان فیلد داخل باکس است و با کلیک (فوکوس) یا پر بودن کوچک می‌شود
// و روی لبهٔ بالای باکس می‌نشیند؛ مثال (placeholder) فقط بعد از کلیک و تا قبل از تایپ دیده می‌شود. ستارهٔ الزامی کنار عنوان است و یک خط راهنما یا خطا زیر فیلد می‌آید،
// پسوند هم داخل فیلد (تومان، ٪، گرم). برچسب با htmlFor به فیلد وصل است و راهنما با aria-describedby. فیلد فوکوس‌شده لبهٔ ۲px برند و سایهٔ نرم زیرش را می‌گیرد (نه حلقهٔ دورتادور).
// «پر بودن» را CSS از :placeholder-shown می‌فهمد، پس فیلد همیشه placeholder دارد (بدون placeholder یک فاصلهٔ خالی که دیده نمی‌شود).
// برچسب بالا رفته ۹px بالاتر از لبهٔ فیلد می‌زند؛ جای آن را فاصلهٔ بالای فیلد در صفحه‌ها می‌دهد.
// عدد، آدرس و نام فایل لاتین‌اند، پس dir="ltr" می‌گیرند و از چپ شروع می‌شوند؛ باقی متن فارسی و راست‌به‌چپ است
const INPUT =
  "block w-full rounded-xl border bg-white px-3.5 text-sm text-gray-900 transition placeholder:text-gray-400 hover:border-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 read-only:bg-gray-50 read-only:text-gray-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]";

// عنوان شناور داخل باکس (باید داخل ظرفی با کلاس ff بیاید). mousedown را می‌گیریم تا کلیک روی عنوانِ فیلدِ فوکوس‌دار آن را بلور نکند
export function FloatLabel({ id, label, required }) {
  return (
    <label htmlFor={id} className="ff-label" onMouseDown={(e) => e.preventDefault()}>
      {label}
      {required && (
        <span aria-hidden="true" className="ms-0.5 text-brand-600">
          *
        </span>
      )}
    </label>
  );
}

function Shell({ id, hint, error, className = "", children }) {
  return (
    <div className={className}>
      {children}
      {(error || hint) && (
        <p id={`${id}-hint`} className={`mt-1.5 text-xs leading-5 ${error ? "text-red-600" : "text-gray-500"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

// suffix: نوشتهٔ کوچک ته فیلد (واحد)، همیشه سمت چپِ فیلد (پایان در صفحهٔ راست‌به‌چپ) با فاصلهٔ فیزیکی pl-16؛ فیلد ltr دارای واحد، عدد را راست‌چین می‌کند تا به واحد نخورد.
// ltr: برای عدد، اسلاگ و نام فایل (بدون واحد از چپ شروع می‌شود)
export function TextInput({ label, hint, error, required, suffix, ltr = false, className = "", inputClassName = "", placeholder = " ", ...props }) {
  const id = useId();
  return (
    <Shell id={id} hint={hint} error={error} className={className}>
      <div className="ff relative">
        <input
          id={id}
          aria-required={required || undefined}
          dir={ltr ? "ltr" : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-hint` : undefined}
          placeholder={placeholder}
          className={`${INPUT} h-11 ${error ? "border-red-400" : "border-gray-300"} ${ltr ? (suffix ? "text-right" : "text-left") : ""} ${suffix ? "pl-16" : ""} ${inputClassName}`}
          {...props}
        />
        {suffix && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-gray-400">
            {suffix}
          </span>
        )}
        <FloatLabel id={id} label={label} required={required} />
      </div>
    </Shell>
  );
}

// اسکرول فیلد چندخطی: زیر ماوس به‌جای اسکرول‌بار بومی (که در صفحهٔ راست‌به‌چپ سمت چپ می‌افتد) همان شست سفارشی سایت می‌آید، سمت راست (ScrollThumb)؛ روی لمس همان بومی می‌ماند.
// لفاف sb-area هم‌اندازهٔ فیلد است، پس با کشیدن گوشهٔ تغییر اندازه شست هم هم‌قد می‌شود. مقدار تازه از بیرون (value) اندازهٔ شست را عوض می‌کند، بی‌آنکه رویداد input بیاید؛ رویداد sb-measure آن را خبر می‌دهد.
// عنوان شناورِ حالت استراحت وسط سطر اول می‌نشیند (--ff-rest: ۱px لبه + ۱۰px padding + نصف سطر ۲۸px = ۲۵px)، نه وسط کل فیلد
export function TextArea({ label, hint, error, required, rows = 3, className = "", placeholder = " ", ...props }) {
  const id = useId();
  const ref = useRef(null);
  const { value } = props;
  useEffect(() => {
    ref.current?.dispatchEvent(new Event("sb-measure"));
  }, [value]);
  return (
    <Shell id={id} hint={hint} error={error} className={className}>
      <div className="sb-area ff relative [--ff-rest:25px]">
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-hint` : undefined}
          placeholder={placeholder}
          className={`sb-hide ${INPUT} resize-y py-2.5 leading-7 ${error ? "border-red-400" : "border-gray-300"}`}
          {...props}
        />
        <FloatLabel id={id} label={label} required={required} />
        <ScrollThumb scrollerRef={ref} />
      </div>
    </Shell>
  );
}

// کاشی کنار هر گزینهٔ سلکت: اگر image داشت تصویر خود گزینه (مثلاً عکس دسته‌بندی)، وگرنه آیکون. اگر تصویر بارگذاری نشد (فایل پاک‌شده) آیکون برمی‌گردد؛
// با عوض‌شدن image باید از بیرون key عوض شود تا خطای تصویر قبلی به تصویر تازه نچسبد. زیر تصویر آیکون نمی‌ماند (تصویر PNG شفاف آیکون را نشان می‌داد)
function SelectTile({ image, Icon }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;
  return (
    <span className="asl-ic" data-img={showImage ? "" : undefined} aria-hidden="true">
      {showImage ? <AppImage src={image} alt="" fill sizes="40px" className="asl-img" onError={() => setFailed(true)} /> : <Icon />}
    </span>
  );
}

// سلکت‌باکس اختصاصی (ظاهر در select.css، همان سلکت صفحهٔ آدرس‌های پروفایل): جای <select> بومی که لیستش را سیستم‌عامل می‌کشد و قابل طراحی نیست.
// باکس هم‌قد و هم‌حلقهٔ فیلدهای دیگر است، کاشی آیکون ابتدای آن و فلشش با باز شدن می‌چرخد؛ منو کارت شیشه‌ای با آیکون هر گزینه و تیک گزینهٔ انتخاب‌شده است.
// الگوی combobox: فوکوس همیشه روی دکمه می‌ماند (aria-activedescendant گزینهٔ فعال را اعلام می‌کند) و کیبورد کامل است: ↑ ↓ Home End Enter Space Esc Tab.
// کلیک بیرون از فیلد منو را می‌بندد. options: [{ value, label, icon?, image? }] (icon کامپوننت lucide؛ image آدرس تصویر گزینه که جای آیکون می‌نشیند)؛ value خالی ("") یعنی هنوز انتخابی نیست.
// عنوان مثل بقیهٔ فیلدها شناور است: تا انتخابی نشده و منو بسته است عنوان داخل باکس (کنار کاشی آیکون) می‌ماند؛ با باز شدن منو یا داشتن مقدار روی لبهٔ باکس می‌رود (data-float) و
// placeholder فقط هنگام باز بودن منو داخل باکس دیده می‌شود (select.css)
// icon: آیکون پیش‌فرض کاشی (تا چیزی انتخاب نشده و برای گزینه‌های بی‌آیکون). onChange مقدار (value) را می‌گیرد، نه رویداد.
// required: فقط ستارهٔ برچسب و aria-required؛ ویژگی بومی required روی فیلد نمی‌نشیند، چون مرورگر برای فیلد خالی روی آن با هاور یک راهنمای پیش‌فرض
// («Please fill out this field.») نشان می‌داد و هنگام ارسال حباب انگلیسی می‌آورد. الزامی بودن را handleSubmit هر صفحه با پیام فارسی (toast) می‌گیرد
export function SelectInput({ label, hint, error, required, placeholder = "انتخاب کنید", icon: DefaultIcon = List, options, value, onChange, disabled = false, className = "" }) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const follow = useRef(false); // باز شدن منو و کیبورد (نه حرکت ماوس): فقط آن‌وقت فهرست تا گزینهٔ فعال می‌لغزد
  const idx = options.findIndex((o) => String(o.value) === String(value ?? ""));
  const current = idx >= 0 ? options[idx] : null;
  const CurrentIcon = current?.icon || DefaultIcon;

  const close = () => {
    follow.current = false;
    setOpen(false);
    setActive(-1);
  };
  const show = () => {
    follow.current = true;
    setActive(idx >= 0 ? idx : options.length ? 0 : -1);
    setOpen(true);
  };
  const choose = (o) => {
    // انتخاب دوبارهٔ همان گزینه تغییری نیست (و مقدار عددیِ صفحهٔ ویرایش را بی‌دلیل رشته نکند)
    if (String(o.value) !== String(value ?? "")) onChange(String(o.value));
    close();
    btnRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [open]);

  // گزینهٔ فعال (با باز شدن: گزینهٔ انتخاب‌شده، با کیبورد: هرکدام) داخل قاب فهرست می‌آید؛ فقط خود فهرست می‌لغزد، نه صفحه
  useEffect(() => {
    const list = listRef.current;
    const el = list?.children[active];
    if (!el || !follow.current) return;
    follow.current = false;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
  }, [active, open]);

  const onKeyDown = (e) => {
    const last = options.length - 1;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      follow.current = true;
      if (!open) show();
      else setActive((a) => (e.key === "ArrowDown" ? Math.min(a + 1, last) : Math.max(a - 1, 0)));
    } else if ((e.key === "Home" || e.key === "End") && open) {
      e.preventDefault();
      follow.current = true;
      setActive(e.key === "Home" ? 0 : last);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) show();
      else if (active >= 0) choose(options[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") close();
  };

  return (
    <Shell id={id} hint={hint} error={error} className={className}>
      <div className="asl ff" ref={rootRef} data-float={open || current ? "" : undefined}>
        <div className="asl-box" data-has={current ? "" : undefined} data-open={open ? "" : undefined} data-bad={error ? "" : undefined}>
          <button
            id={id}
            ref={btnRef}
            type="button"
            className="asl-btn"
            disabled={disabled}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${id}-hint` : undefined}
            aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
            onClick={() => (open ? close() : show())}
            onKeyDown={onKeyDown}
          >
            <SelectTile key={current?.image || ""} image={current?.image} Icon={CurrentIcon} />
            <span className="asl-txt">{current ? current.label : placeholder}</span>
            <ChevronDown className="asl-chev" aria-hidden="true" />
          </button>
        </div>
        <FloatLabel id={id} label={label} required={required} />
        {open && (
          <div className="asl-pop">
            <div className="sb-area relative">
              <ul ref={listRef} className="asl-list sb-hide" id={listId} role="listbox" aria-label={label}>
                {options.length === 0 && <li role="presentation" className="asl-empty">موردی برای انتخاب نیست</li>}
                {options.map((o, i) => {
                  const OptionIcon = o.icon || DefaultIcon;
                  const selected = i === idx;
                  return (
                    <li
                      key={o.value}
                      id={`${id}-opt-${i}`}
                      role="option"
                      aria-selected={selected}
                      data-active={i === active ? "" : undefined}
                      className="asl-opt"
                      onMouseEnter={() => {
                        follow.current = false;
                        setActive(i);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(o)}
                    >
                      <SelectTile key={o.image || ""} image={o.image} Icon={OptionIcon} />
                      <span className="asl-txt">{o.label}</span>
                      {selected && <Check className="asl-tick" aria-hidden="true" />}
                    </li>
                  );
                })}
              </ul>
              <ScrollThumb scrollerRef={listRef} />
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
