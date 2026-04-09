"use client";

import ProductDetails from "@/app/components/ProductDetails";
import { use } from "react";

export default function ProductDetailPage({ params }) {
  const { slug } = use(params);
  const decodedSlug = decodeURIComponent(slug); // دی‌کد کردن slug
  return <ProductDetails slug={decodedSlug} />;
}