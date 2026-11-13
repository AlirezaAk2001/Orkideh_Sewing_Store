// components/SellerBox.jsx
import { Headset, Phone, Store } from "lucide-react";
import { STORE } from "@/lib/contact";

// کارت فروشنده + تماس: نیمهٔ بالا نام فروشنده و نیمهٔ پایین دعوت به تماس (مشاوره و خرید تلفنی؛ روی موبایل با لمس شماره‌گیر باز می‌شود)،
// با خط بخیه بین آن‌ها. استایل در app/components/product/product.css (.pd-deal)
export default function SellerBox({ sellerName }) {
  return (
    <div className="pd-deal" dir="rtl">
      <div className="pd-seller">
        <span className="pd-seller-i" aria-hidden="true">
          <Store />
        </span>
        <div>
          <small>فروشنده</small>
          <b>{sellerName}</b>
        </div>
      </div>
      <div className="pd-stitch" aria-hidden="true" />
      <div className="pd-call">
        <p>
          <Headset aria-hidden="true" />
          برای مشاوره و خرید تلفنی تماس بگیرید
        </p>
        <div className="pd-phones">
          {STORE.phones.map((phone) => (
            <a key={phone.href} href={phone.href} className="pd-phone btn-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              <span className="pd-phone-i" aria-hidden="true">
                <Phone />
              </span>
              <span>
                <small>{phone.label}</small>
                <b dir="ltr">{phone.display}</b>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
