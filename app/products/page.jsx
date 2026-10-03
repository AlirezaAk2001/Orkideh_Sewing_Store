import ProductsList from "@/app/components/ProductsList";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "همه محصولات",
  description: "فهرست همهٔ محصولات فروشگاه چرخ خیاطی ارکیده: چرخ خیاطی و لوازم جانبی؛ مشاهدهٔ قیمت و خرید آنلاین",
  path: "/products",
});

export default function ProductsPage() {
  return <ProductsList />;
}
