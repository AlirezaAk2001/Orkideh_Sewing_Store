import { rangesOf } from "./search";
import "./highlight.css";

// متن با یافته‌های جست‌وجو که در <mark> (استایل hl-mark در highlight.css) می‌آیند؛ بدون جست‌وجو یا بدون یافته خود متن
export default function Highlight({ text, terms }) {
  const s = String(text ?? "");
  if (!terms?.length) return s;
  const ranges = rangesOf(s, terms);
  if (ranges.length === 0) return s;
  const parts = [];
  let at = 0;
  ranges.forEach(([a, b], i) => {
    if (a > at) parts.push(s.slice(at, a));
    parts.push(
      <mark key={i} className="hl-mark">
        {s.slice(a, b)}
      </mark>
    );
    at = b;
  });
  if (at < s.length) parts.push(s.slice(at));
  return <>{parts}</>;
}
