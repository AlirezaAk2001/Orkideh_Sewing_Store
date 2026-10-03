import ProductsList from "@/app/components/ProductsList";
import { listProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "همه محصولات",
  description: "فهرست همهٔ محصولات فروشگاه چرخ خیاطی ارکیده: چرخ خیاطی و لوازم جانبی؛ مشاهدهٔ قیمت و خرید آنلاین",
  path: "/products",
});

// قیمت و موجودی در هر درخواست تازه از دیتابیس خوانده می‌شود، نه هنگام build
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listProducts();
  return <ProductsList products={products} />;
}
