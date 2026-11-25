"use client";

import { Check, LogIn, MailCheck, RefreshCw, UserPlus } from "lucide-react";

// تکه‌های ظاهری کارت تأیید ایمیل (VerifyPage.jsx)؛ استایل و حرکتشان در verify.css

const STEPS = [
  { label: "ثبت‌نام", icon: UserPlus },
  { label: "تأیید ایمیل", icon: MailCheck },
  { label: "ورود", icon: LogIn },
];

// مسیر ساخت حساب: ثبت‌نام (انجام‌شده) ← تأیید ایمیل ← ورود. خط میان دو مرحله وضعیت مرحلهٔ بعد را دارد
export function VerifySteps({ done }) {
  const at = done ? 2 : 1;
  const stateOf = (i) => (i < at ? "done" : i === at ? "now" : "todo");

  return (
    <ol className="vf-steps" aria-label="مراحل ساخت حساب">
      {STEPS.map(({ label, icon: Icon }, i) => {
        const state = stateOf(i);
        const Mark = state === "done" ? Check : Icon;
        return (
          <li key={label} className="vf-step" data-state={state} aria-current={state === "now" ? "step" : undefined}>
            <span className="vf-dot" aria-hidden="true">
              <Mark key={state} className="vf-dot-icon h-3.5 w-3.5" strokeWidth={state === "done" ? 3.2 : 2.2} />
            </span>
            {i < STEPS.length - 1 && <span className="vf-link" data-state={stateOf(i + 1)} aria-hidden="true" />}
            <span className="vf-step-label">
              {label}
              {state === "done" && <span className="sr-only">: انجام شد</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const SPARK = "M0-5C.6-1.5 1.5-.6 5 0 1.5.6.6 1.5 0 5-.6 1.5-1.5.6-5 0-1.5-.6-.6-1.5 0-5Z";
const SPARKS = [
  { x: 11, y: 30, s: 1, delay: "0s" },
  { x: 108, y: 20, s: 1.25, delay: "-0.9s" },
  { x: 106, y: 68, s: 0.75, delay: "-1.7s" },
];

// پاکت‌نامهٔ زنده: نامه از پاکت بیرون می‌آید و شش نقطهٔ روی آن همراه تایپ کاربر یکی‌یکی روشن می‌شوند (filled). با کد کامل نامه کمی بالاتر می‌آید و با خطا پاکت می‌لرزد
export function VerifyEnvelope({ filled, total, invalid }) {
  return (
    <div className="vf-hero" data-invalid={invalid || undefined} data-full={filled === total || undefined} aria-hidden="true">
      <span className="vf-ring" />
      <span className="vf-ring vf-ring--late" />
      <svg className="vf-env" viewBox="0 0 120 92" fill="none">
        <defs>
          <linearGradient id="vf-g-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--color-brand-600)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-brand-700)" }} />
          </linearGradient>
          <linearGradient id="vf-g-front" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--color-brand-500)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-brand-600)" }} />
          </linearGradient>
        </defs>

        {SPARKS.map((s) => (
          <g key={s.x} transform={`translate(${s.x} ${s.y}) scale(${s.s})`}>
            <path className="vf-spark" d={SPARK} style={{ animationDelay: s.delay }} />
          </g>
        ))}

        <g className="vf-float">
          <path d="M22 44 60 15 98 44V78a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8Z" fill="url(#vf-g-back)" stroke="url(#vf-g-back)" strokeWidth="3" strokeLinejoin="round" />
          <g className="vf-letter">
            <g className="vf-letter-lift">
              <rect className="vf-paper" x="31" y="22" width="58" height="48" rx="7" />
              <rect className="vf-line" x="46" y="29" width="28" height="4" rx="2" />
              {Array.from({ length: total }, (_, i) => (
                <circle key={i} className="vf-pin" data-on={i < filled || undefined} cx={40 + i * 8} cy="43" r="2.8" />
              ))}
              <rect className="vf-line" x="50" y="52" width="20" height="3" rx="1.5" />
            </g>
          </g>
          <path d="M22 45 60 68 98 45V78a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8Z" fill="url(#vf-g-front)" stroke="url(#vf-g-front)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M25 83 49 62M95 83 71 62" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
          <path className="vf-stitch" d="M34 79.5H86" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

const RING = 2 * Math.PI * 8;

// ارسال دوبارهٔ کد؛ تا پایان فاصلهٔ لازم، حلقهٔ دور دکمه همراه ثانیه‌های واقعیِ باقی‌مانده خالی می‌شود
export function ResendButton({ cooldown, total, sending, onClick }) {
  const waiting = cooldown > 0;
  return (
    <button type="button" onClick={onClick} disabled={sending || waiting} className="vf-again">
      {waiting ? (
        <svg className="vf-count" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" />
          <circle cx="10" cy="10" r="8" style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - Math.min(cooldown / total, 1)) }} />
        </svg>
      ) : (
        <RefreshCw className={`h-4 w-4 ${sending ? "animate-spin" : ""}`} aria-hidden="true" />
      )}
      {waiting ? `ارسال مجدد کد (${cooldown.toLocaleString("fa-IR")} ثانیه)` : sending ? "در حال ارسال..." : "ارسال مجدد کد"}
    </button>
  );
}

const CONFETTI = ["var(--color-brand-500)", "#10b981", "#f59e0b"];

// نمای موفقیت: تیک کشیده می‌شود، تکه‌بخیه‌های رنگی بیرون می‌پرند و نوار تا لحظهٔ رفتن به صفحهٔ ورود پر می‌شود (ms همان تأخیر واقعی انتقال)
export function VerifySuccess({ ms }) {
  return (
    <div className="vf-done" role="status">
      <span className="vf-done-mark" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} style={{ "--a": `${i * 30}deg`, background: CONFETTI[i % CONFETTI.length] }} />
        ))}
        <svg viewBox="0 0 52 52" fill="none">
          <circle className="vf-done-disc" cx="26" cy="26" r="24" />
          <path className="vf-done-tick" d="M15.5 27l7 7L37 19.5" pathLength="1" />
        </svg>
      </span>
      <p className="vf-done-title">ایمیل شما تأیید شد!</p>
      <p className="vf-done-text">در حال انتقال به صفحهٔ ورود…</p>
      <span className="vf-done-bar" aria-hidden="true">
        <span style={{ animationDuration: `${ms}ms` }} />
      </span>
    </div>
  );
}
