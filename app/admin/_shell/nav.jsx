import Icon from "@mdi/react";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { LayoutDashboard, ShoppingBag, Truck } from "lucide-react";
import { mdiAccountFileText, mdiCommentAccountOutline, mdiPanoramaVariantOutline } from "@mdi/js";

// آیکون‌ها همان‌هایی‌اند که روی کارت‌های میان‌بر داشبورد هم هستند (هر بخش در همه‌جا یک آیکون دارد)؛ همه ۲۰ پیکسل
export const NAV_GROUPS = [
  {
    label: null,
    items: [{ href: "/admin", label: "داشبورد", icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />, exact: true }],
  },
  {
    label: "فروشگاه",
    items: [
      { href: "/admin/banners", label: "بنرها", icon: <Icon path={mdiPanoramaVariantOutline} size="20px" aria-hidden="true" />, total: { key: "banners", text: "بنر" } },
      { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: <CategoryOutlinedIcon fontSize="small" aria-hidden="true" />, total: { key: "categories", text: "دسته‌بندی" } },
      { href: "/admin/products", label: "محصولات", icon: <ShoppingBag className="h-5 w-5" aria-hidden="true" />, total: { key: "products", text: "محصول" } },
      { href: "/admin/shipping", label: "روش‌های ارسال", icon: <Truck className="h-5 w-5" aria-hidden="true" />, total: { key: "shipping", text: "روش ارسال" } },
    ],
  },
  {
    label: "مشتریان",
    items: [
      // badge: شمارندهٔ منتظر-شما روی ردیف (کلید در پاسخ /api/admin/attention؛ لحن رنگ و برچسب صفحه‌خوان)؛ total: تعداد کل بخش، خاکستری.
      // هر ردیف یک نشان دارد: اگر چیزی منتظر شماست همان (رنگی)، وگرنه تعداد کل
      { href: "/admin/comments", label: "نظرات کاربران", icon: <Icon path={mdiCommentAccountOutline} size="20px" aria-hidden="true" />, badge: { key: "pendingComments", tone: "amber", text: "نظر در انتظار تأیید" }, total: { key: "comments", text: "نظر" } },
      { href: "/admin/orders", label: "سفارش‌های کاربران", icon: <Icon path={mdiAccountFileText} size="20px" aria-hidden="true" />, badge: { key: "processingOrders", tone: "blue", text: "سفارش جاری" }, total: { key: "orders", text: "سفارش" } },
    ],
  },
];

const ITEMS = NAV_GROUPS.flatMap((g) => g.items);

// بخش فعال: خود صفحهٔ بخش و زیرصفحه‌هایش (افزودن، ویرایش)؛ داشبورد فقط خودش، وگرنه همیشه فعال می‌ماند
export function isActive(item, pathname) {
  if (!pathname) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function findNavItem(pathname) {
  return ITEMS.find((item) => isActive(item, pathname));
}
