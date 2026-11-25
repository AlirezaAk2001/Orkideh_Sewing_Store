import { CreditCard, ReceiptText, Truck, Undo2 } from "lucide-react";
import HandoverIcon from "@/app/components/HandoverIcon";

// مرحله‌های یک سفارش از وضعیتش: ثبت → پرداخت → ارسال → تحویل‌داده‌شده (مثل مراحل پروفایل، با همان آیکون جعبه و دست). state: done (انجام شده)، now (مرحلهٔ در انتظار، تپنده)،
// bad (مرجوع، به‌جای آخرین مرحله)، todo (هنوز نه). وضعیت «ارسال شد» جدایی در داده نیست: سفارش جاری در «منتظر تحویل» می‌ایستد و با تحویل یا مرجوعی ارسالش انجام‌شده است
function stepsOf(status) {
  const unpaid = status === "pending";
  const shipping = {
    processing: { label: "منتظر تحویل", state: "now" },
    delivered: { label: "ارسال شد", state: "done" },
    returned: { label: "ارسال شد", state: "done" },
  }[status] ?? { label: "ارسال", state: "todo" };
  const last =
    status === "returned"
      ? { label: "مرجوع شد", icon: Undo2, state: "bad" }
      : { label: "تحویل‌داده‌شده", icon: HandoverIcon, state: status === "delivered" ? "done" : "todo" };
  return [
    { label: "ثبت سفارش", icon: ReceiptText, state: "done" },
    { label: unpaid ? "منتظر پرداخت" : "پرداخت شد", icon: CreditCard, state: unpaid ? "now" : "done" },
    { icon: Truck, ...shipping },
    last,
  ];
}

const STATE_TEXT = { done: "انجام شده", now: "در انتظار", bad: "انجام شده", todo: "هنوز نرسیده" };

// خط زمان کارت سفارش (استایل od-line در orders.css، رنگش همان رنگ وضعیت کارت: --od-c): مثل مراحل پروفایل، ستون‌ها هم‌عرض‌اند و خط هر مرحله درست از لبهٔ دایرهٔ خودش
// بیرون می‌آید و به لبهٔ دایرهٔ مرحلهٔ بعد می‌رسد (بی‌فاصله). وضعیت خط همان وضعیت مرحلهٔ بعد است: انجام‌شده توپُر (هنگام ورود از دایرهٔ مبدأ پر می‌شود)، در انتظار
// بخیهٔ متحرک (خط‌چینی که به سمت مرحلهٔ بعد می‌رود) و هنوز‌نرسیده خط‌چین ثابت خاکستری. کامیون و دست تحویل رو به چپ‌اند، جهت راه مرحله‌ها
export default function OrderTimeline({ status }) {
  const steps = stepsOf(status);
  return (
    <ol className="od-line" aria-label="مراحل سفارش">
      {steps.map(({ label, icon: Icon, state }, i) => (
        <li key={i} className="od-step" data-state={state}>
          <span className="od-dot" aria-hidden="true">
            {state === "now" && <span className="od-halo" />}
            <Icon key={label} className="od-icon h-3.5 w-3.5" />
          </span>
          {steps[i + 1] && <span aria-hidden="true" className="od-link" data-state={steps[i + 1].state} style={{ "--i": i + 1 }} />}
          <span className="od-label">
            {label}
            <span className="sr-only">: {STATE_TEXT[state]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
