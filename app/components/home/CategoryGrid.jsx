import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import AppImage from "../AppImage";
import SectionHeading from "./SectionHeading";

// دسته‌بندی‌ها؛ تعداد کم هم وسط‌چین می‌ماند (flex + wrap، نه ستون ثابت).
// با یک یا دو دسته، کاشی‌ها روی دسکتاپ افقی و پهن می‌شوند تا دو طرف صفحه خالی نماند.
export default function CategoryGrid({ categories, error }) {
  const wide = categories.length <= 2;
  const single = categories.length === 1; // عنوان با یک دسته مفرد می‌شود
  // با سه دسته هر کاشی یک‌سوم عرض می‌گیرد (نه یک‌چهارم)، تا دو طرف خالی نماند
  const tileWidth = wide
    ? "w-[calc(50%-0.5rem)]"
    : categories.length === 3
      ? "w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)]"
      : "w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] lg:w-[calc(25%-0.75rem)]";
  const imageSizes = wide
    ? "(min-width: 768px) 30vw, 46vw"
    : `(min-width: 1024px) ${categories.length === 3 ? 400 : 300}px, (min-width: 768px) 30vw, 46vw`;

  return (
    <section aria-labelledby="home-categories">
      <SectionHeading
        id="home-categories"
        title={single ? "دسته‌بندی" : "دسته‌بندی‌ها"}
        subtitle={single ? "محصول مورد نظرتان را در این دسته پیدا کنید" : "محصول مورد نظرتان را از میان دسته‌ها پیدا کنید"}
      />
      {error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <ul className="flex flex-wrap justify-center gap-4">
          {categories.map((cat) => (
            <li key={cat.id} className={tileWidth}>
              <Link
                href={`/categories/${cat.slug}`}
                className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-brand-200 ${
                  wide ? "md:flex-row" : ""
                }`}
              >
                <div
                  className={`relative aspect-[4/3] ${cat.image ? "" : "bg-brand-50"} ${
                    wide ? "md:w-[46%] md:shrink-0" : ""
                  }`}
                >
                  {cat.image ? (
                    <AppImage
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes={imageSizes}
                      className="object-contain p-5 transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-brand-200">
                      <Layers className="h-12 w-12" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div
                  className={`flex items-center justify-between gap-2 px-4 py-3 ${
                    wide ? "md:flex-1 md:flex-col md:items-center md:justify-center md:gap-4 md:px-8 md:text-center" : ""
                  }`}
                >
                  <h3 className={`font-semibold text-gray-800 ${wide ? "md:text-xl" : ""}`}>{cat.name}</h3>
                  <span
                    className={`flex items-center gap-1 text-sm text-brand-600 ${
                      wide ? "md:rounded-full md:bg-brand-50 md:px-4 md:py-2 md:font-medium" : ""
                    }`}
                  >
                    <span className="hidden sm:inline">مشاهده</span>
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
