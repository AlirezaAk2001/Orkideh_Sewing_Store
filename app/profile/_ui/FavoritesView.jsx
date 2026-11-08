"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { mdiDeleteSweepOutline } from "@mdi/js";
import { useFavorites } from "@/lib/context";
import ConfirmDialog from "./ConfirmDialog";
import { Ic } from "./icons";
import { fa } from "./format";
import { Empty, Pcard, ViewHead } from "./parts";

// علاقه‌مندی‌ها: شبکهٔ کارت محصول. قلب هر کارت (با تأییدیهٔ صفحهٔ پنل که نمای کلی هم از آن استفاده می‌کند) آن را برمی‌دارد و «حذف همه» همهٔ فهرست را خالی می‌کند.
// onAdd همان افزودن به سبدِ همراه پرواز تصویر است
export default function FavoritesView({ favorites, leavingId, onUnfav, onAdd }) {
  const { clearFavorites } = useFavorites();
  const [askClear, setAskClear] = useState(false);

  const confirmClear = () => {
    setAskClear(false);
    clearFavorites();
    toast.success("تمام محصولات از علاقه‌مندی‌های شما حذف شدند.", { icon: "🗑️" });
  };

  return (
    <>
      <ViewHead icon="heart" title="علاقه‌مندی‌ها" sub={favorites.length ? `${fa(favorites.length)} کالا ذخیره شده` : "هنوز چیزی ذخیره نشده"}>
        {favorites.length > 1 && (
          <button type="button" className="btn btn-soft-red sm" onClick={() => setAskClear(true)}>
            <Ic n="trash" />
            حذف همه
          </button>
        )}
      </ViewHead>

      {favorites.length ? (
        <div className="fgrid">
          {favorites.map((item, i) => (
            <Pcard key={item.id} item={item} index={i} leaving={leavingId === item.id} onUnfav={onUnfav} onAdd={onAdd} />
          ))}
        </div>
      ) : (
        <Empty icon="heart" title="هنوز چیزی ذخیره نکرده‌اید" text="با زدن قلب روی هر محصول، اینجا نگهش می‌داریم.">
          <Link href="/products" className="btn btn-primary" style={{ marginTop: 10 }}>
            <Ic n="store" />
            مشاهدهٔ محصولات
          </Link>
        </Empty>
      )}

      <ConfirmDialog open={askClear} onClose={() => setAskClear(false)} onConfirm={confirmClear} title="حذف تمام علاقه‌مندی‌ها" icon={mdiDeleteSweepOutline} minWidth="320px" confirmLabel="بله، همه را حذف کن" confirmIcon={mdiDeleteSweepOutline}>
        آیا مطمئن هستید که می‌خواهید تمام محصولات زیر را از علاقه‌مندی‌های خود حذف کنید؟
        <ul style={{ marginTop: 10, paddingRight: 8, display: "flex", flexDirection: "column", gap: 6, listStyle: "none" }}>
          {favorites.map((it, i) => (
            <li key={it.id} style={{ fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", backgroundColor: "#ef4444", color: "#fff", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>
                {fa(i + 1)}
              </span>
              {it.name}
            </li>
          ))}
        </ul>
      </ConfirmDialog>
    </>
  );
}
