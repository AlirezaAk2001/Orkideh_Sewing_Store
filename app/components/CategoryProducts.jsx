"use client";

import React, { useEffect } from "react";
import ProductCard from "@/app/components/ProductCard";
import { Toaster } from "react-hot-toast";

// محصولات یک دسته؛ داده را صفحهٔ سروری (app/categories/[slug]/page.jsx) می‌دهد تا در همان HTML اولیه باشد
export default function CategoryProducts({ name, products }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (products.length === 0)
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          محصولات دسته: <span className="text-blue-600">{name}</span>
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
        محصولات دسته: <span className="text-blue-600">{name}</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="h-full opacity-0 transform scale-95 animate-fade-in"
            style={{
              animationDelay: `${Math.min(index, 8) * 0.05}s`,
              animationFillMode: "forwards",
            }}
          >
            <div className="h-full">
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