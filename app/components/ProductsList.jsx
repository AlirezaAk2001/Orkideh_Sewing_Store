"use client";

import React, { useEffect } from "react";
import ProductCard from "@/app/components/ProductCard";
import { Toaster } from "react-hot-toast";

// فهرست محصولات؛ داده را صفحهٔ سروری (app/products/page.jsx) می‌دهد تا در همان HTML اولیه باشد
export default function ProductsList({ products }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (products.length === 0)
    return <p className="text-center text-gray-500 mt-10">محصولی یافت نشد.</p>;

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

      <h1 className="text-2xl font-bold mb-6 text-center">همه محصولات</h1>

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
            <div className="bg-white rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-gray-300 hover:ring-opacity-60">
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