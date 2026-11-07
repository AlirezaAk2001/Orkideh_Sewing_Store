// ذره‌بین جستجو (SVG ساده، بدون state). حرکت‌هایش با کلاس‌های xs-glyph-* در globals.css و از روی والدی با کلاس xs-orb درمی‌آیند:
// در حالت عادی نرم معلق است و هر چند ثانیه یک‌بار خودش را پاک می‌کند و از صفر دوباره می‌کشد (عدسی، بعد دسته)، با هاور عدسی بزرگ و دسته کج می‌شود.
// pathLength=100 برای هر دو شکل: طول خط‌چین انیمیشن کشیدن در CSS یکی است و به اندازهٔ واقعی شکل بستگی ندارد
export default function SearchGlyph({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`xs-glyph ${className}`} aria-hidden="true">
      <g className="xs-glyph-lens">
        <circle className="xs-glyph-ring" cx="10.5" cy="10.5" r="6.4" pathLength="100" stroke="currentColor" strokeWidth="2.3" />
        <path className="xs-glyph-glint" d="M7.5 9.3a3.5 3.5 0 0 1 2.4-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <path className="xs-glyph-handle" d="M15.4 15.4 20.7 20.7" pathLength="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
