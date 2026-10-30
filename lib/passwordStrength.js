// قوانین و قدرت رمز عبور برای راهنمای کنار فیلد رمز (ثبت‌نام و تغییر رمز).
// پنج قانون اول همان چیزی است که regex فرم‌ها می‌پذیرد (حداقل ۸ کاراکتر، حرف و عدد و یک نماد، فقط از همین کاراکترها)؛ اگر آن regex عوض شد، اینجا هم عوض شود.
// دو پیشنهاد آخر فقط رمز را قوی‌تر می‌کنند و مانع ثبت نیستند.

export const PASSWORD_SYMBOLS = "@ $ ! % * # ? & _";

export const STRENGTH_LABELS = ["", "ضعیف", "متوسط", "خوب", "قوی"];

export function evaluatePassword(value) {
  const pw = typeof value === "string" ? value : "";

  const rules = [
    { id: "length", label: "حداقل ۸ کاراکتر", ok: pw.length >= 8 },
    { id: "letter", label: "حداقل یک حرف انگلیسی", ok: /[A-Za-z]/.test(pw) },
    { id: "digit", label: "حداقل یک عدد انگلیسی", ok: /\d/.test(pw) },
    { id: "symbol", label: "حداقل یک نماد", symbols: PASSWORD_SYMBOLS, ok: /[@$!%*#?&_]/.test(pw) },
    { id: "chars", label: "فقط حروف و اعداد انگلیسی و نمادهای بالا", ok: /^[A-Za-z\d@$!%*#?&_]*$/.test(pw) },
  ];
  const extras = [
    { id: "case", label: "ترکیب حروف بزرگ و کوچک", ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
    { id: "long", label: "۱۲ کاراکتر یا بیشتر", ok: pw.length >= 12 },
  ];

  const valid = rules.every((r) => r.ok);
  const points = rules.slice(0, 4).filter((r) => r.ok).length + extras.filter((r) => r.ok).length;

  // ضعیف: دو شرط یا بیشتر رعایت نشده؛ متوسط: همهٔ شرط‌ها هست (یا یکی کم) ولی ساده؛ خوب: یک پیشنهاد هم رعایت شده؛ قوی: هر دو
  let level = points <= 2 ? 1 : points <= 4 ? 2 : points === 5 ? 3 : 4;
  if (!valid) level = Math.min(level, 2); // رمزی که فرم نمی‌پذیرد خوب یا قوی نیست
  if (!rules[4].ok) level = 1; // کاراکتر غیرمجاز یعنی رمز اصلاً پذیرفته نمی‌شود
  if (pw === "") level = 0;

  return { level, label: STRENGTH_LABELS[level], valid, rules, extras };
}
