"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProductCard from "@/app/components/ProductCard";
import { Toaster } from "react-hot-toast";

export default function CategoryProducts() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    async function fetchCategoryData() {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/categories/by-slug/${slug}`);

        if (!res.ok) {
          if (res.status === 404) throw new Error("دسته‌بندی مورد نظر یافت نشد.");
          throw new Error("خطا در دریافت اطلاعات دسته‌بندی");
        }

        const data = await res.json();

        setCategoryName(data.name);

        const productsWithCategoryInfo = (data.Product || []).map(product => ({
          ...product,
          Category: {
            name: data.name,
            slug: data.slug,
          },
        }));

        setProducts(productsWithCategoryInfo);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryData();
  }, [slug]);

  if (loading)
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="h-8 w-48 bg-gray-300 rounded mx-auto mb-6 animate-pulse"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-14">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-300 rounded-lg h-64 animate-pulse overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer"></div>
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            background: linear-gradient(
              90deg,
              rgba(200, 200, 200, 0.3) 0%,
              rgba(255, 255, 255, 0.6) 50%,
              rgba(200, 200, 200, 0.3) 100%
            );
            animation: shimmer 1.5s infinite;
          }
        `}</style>
      </div>
    );

  if (error)
    return <p className="text-center text-red-500 mt-10">{error}</p>;

  if (products.length === 0)
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          محصولات دسته: <span className="text-blue-600">{categoryName}</span>
        </h1>
        <p className="text-center text-gray-500 mt-10">هیچ محصولی در این دسته‌بندی یافت نشد.</p>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-10">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            fontFamily: "Vazirmatn, sans-serif",
            direction: "rtl",
            borderRadius: "10px",
            fontSize: "14px",
          },
        }}
      />

      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
        محصولات دسته: <span className="text-blue-600">{categoryName}</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="opacity-0 transform scale-95 animate-fade-in"
            style={{
              animationDelay: `${index * 0.1}s`,
              animationFillMode: "forwards",
            }}
          >
            <div className="bg-white rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-gray-300 hover:ring-opacity-60 h-full">
              <ProductCard product={product} priority={index < 4} />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}