// هندسهٔ نمودار کوچک روند (جدا از React تا جداگانه تست شود). values از قدیم به جدید؛ null = روز بی‌داده که خط را قطع می‌کند.
// قدیمی‌ترین روز سمت راست است (RTL). baseline:
//   "zero": صفر ته نمودار است (فروش، تعداد سفارش، مشتری)
//   "min": از کمترین تا بیشترین مقدار (میانگین هر سفارش که از صفر شروع شدنش خط را صاف می‌کند)، ولی دست‌کم ۲۵٪ بیشترین را می‌پوشاند
//         تا نوسان کوچک مثل زلزله دیده نشود
export function sparkGeometry(values, { width = 96, height = 34, pad = 5, baseline = "zero" } = {}) {
  const ok = (v) => v !== null && v !== undefined && Number.isFinite(v);
  const real = values.filter(ok);
  if (real.length < 2) return null;
  const max = Math.max(...real);
  if (!(max > 0)) return null;
  const lo = baseline === "min" ? Math.min(Math.min(...real), max * 0.75) : 0;
  const step = (width - 2 * pad) / (values.length - 1);
  const x = (i) => width - pad - i * step;
  const y = (v) => height - pad - ((v - lo) / (max - lo)) * (height - 2 * pad);

  const segments = [];
  let current = null;
  let lastIndex = -1;
  values.forEach((v, i) => {
    if (!ok(v)) {
      current = null;
      return;
    }
    if (!current) {
      current = [];
      segments.push(current);
    }
    current.push([x(i), y(v)]);
    lastIndex = i;
  });
  return { segments, last: [x(lastIndex), y(values[lastIndex])] };
}

// مسیر SVG؛ بخشی که فقط یک نقطه دارد با سر گرد خط به یک نقطه تبدیل می‌شود
export function sparkPath(segments) {
  return segments
    .map((seg) => {
      const pts = seg.length === 1 ? [seg[0], seg[0]] : seg;
      return pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
    })
    .join(" ");
}
